import { theme, type ThemeConfig } from 'antd';
import { FONT_DISPLAY, FONT_TEXT, brand, palettes, type ThemeMode } from './tokens';

/** Ant Design tokens mapped onto the Dủ palette: square corners, 2px ink borders, green primary. */
export function antdTheme(mode: ThemeMode): ThemeConfig {
  const c = palettes[mode];
  const field = { fontFamily: FONT_TEXT, colorBgContainer: c.field, activeShadow: 'none', hoverBorderColor: brand.green, activeBorderColor: brand.green };
  return {
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: brand.green,
      colorSuccess: brand.green,
      colorError: c.redText,
      colorWarning: brand.orange,
      colorInfo: brand.green,
      colorText: c.text,
      colorTextSecondary: c.muted,
      colorTextPlaceholder: c.faint,
      colorBgBase: c.bg,
      colorBgContainer: c.surface,
      colorBgElevated: c.surface,
      colorBgMask: c.mask,
      colorBorder: c.edge,
      colorBorderSecondary: c.line,
      fontFamily: FONT_DISPLAY,
      fontSize: 14,
      borderRadius: 0,
      borderRadiusLG: 0,
      borderRadiusSM: 0,
      lineWidth: 2,
      controlHeight: 46,
      controlOutline: 'transparent',
      motionDurationMid: '0.25s',
    },
    components: {
      Input: { ...field, paddingInline: 12, inputFontSize: 15 },
      InputNumber: field,
      Select: { ...field, fontSize: 15, optionSelectedBg: c.surfaceAlt, optionSelectedColor: c.greenText },
      Checkbox: { fontFamily: FONT_DISPLAY, borderRadiusSM: 0, controlInteractiveSize: 18 },
      Radio: { radioSize: 18, dotSize: 8 },
      Segmented: {
        trackBg: c.surfaceAlt, trackPadding: 4, itemSelectedBg: brand.green, itemSelectedColor: brand.gold,
        itemColor: c.text, itemHoverColor: c.text, itemHoverBg: 'transparent', itemActiveBg: 'transparent',
        controlHeightLG: 48, fontSizeLG: 16, borderRadius: 0, borderRadiusLG: 0, borderRadiusSM: 0, borderRadiusXS: 0,
      },
      Tag: { defaultBg: c.surface, borderRadiusSM: 0 },
      Drawer: { colorBgElevated: c.bg },
      Message: { contentBg: brand.ink, contentPadding: '12px 20px', colorText: brand.gold, fontFamily: FONT_DISPLAY },
      Tooltip: { colorBgSpotlight: brand.ink, colorTextLightSolid: brand.gold, fontFamily: FONT_DISPLAY },
      Badge: { indicatorHeight: 20, textFontSize: 11, textFontWeight: 900 },
    },
  };
}
