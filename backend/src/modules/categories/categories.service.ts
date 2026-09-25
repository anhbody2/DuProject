import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { slugify } from '../../common/utils/slugify';
import { Category } from '../../database/models';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

type CategoryNode = { id: number; parentId: number | null; name: string; slug: string; children: CategoryNode[] };

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category) private readonly categories: typeof Category) {}

  /** Full category tree. */
  async findTree() {
    const all = await this.categories.findAll({ order: [['name', 'ASC']] });
    const nodes = new Map<number, CategoryNode>(
      all.map((c) => [c.id, { ...(c.toJSON() as Omit<CategoryNode, 'children'>), children: [] }]),
    );
    const roots: CategoryNode[] = [];
    for (const node of nodes.values()) {
      const parent = node.parentId ? nodes.get(node.parentId) : undefined;
      (parent ? parent.children : roots).push(node);
    }
    return roots;
  }

  async findOne(id: number) {
    const category = await this.categories.findByPk(id, {
      include: [
        { model: Category, as: 'parent' },
        { model: Category, as: 'children' },
      ],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) await this.findOne(dto.parentId);
    return this.categories.create({ ...dto, slug: dto.slug ?? slugify(dto.name) });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    if (dto.parentId) await this.assertNoCycle(id, dto.parentId);
    return category.update(dto);
  }

  /** Fails with 409 while products still reference the category. */
  async remove(id: number) {
    const category = await this.findOne(id);
    await category.destroy();
  }

  /** A category cannot become a child of itself or of one of its descendants. */
  private async assertNoCycle(id: number, parentId: number) {
    let cursor: number | null = parentId;
    while (cursor) {
      if (cursor === id) throw new BadRequestException('Category hierarchy cannot contain cycles');
      const parent: Category | null = await this.categories.findByPk(cursor);
      if (!parent) throw new NotFoundException('Parent category not found');
      cursor = parent.parentId;
    }
  }
}
