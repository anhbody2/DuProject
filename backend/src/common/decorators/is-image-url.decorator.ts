import { isURL, ValidateBy, type ValidationOptions } from 'class-validator';

/** Paths returned by POST /uploads/images. */
const UPLOADED_IMAGE = /^\/api\/uploads\/images\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

/** An absolute URL, or the path of an image uploaded through POST /uploads/images. */
export function IsImageUrl(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isImageUrl',
      validator: {
        validate: (value) => typeof value === 'string' && (UPLOADED_IMAGE.test(value) || isURL(value)),
        defaultMessage: (args) => `${args?.property ?? 'value'} must be a URL or an uploaded image path`,
      },
    },
    options,
  );
}
