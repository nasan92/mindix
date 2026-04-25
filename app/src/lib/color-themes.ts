import type { ColorTheme, ThemeName } from '../types'

const COLOR_THEME_KEY = 'mindmaps.color.theme'

export const COLOR_THEMES: Record<ThemeName, ColorTheme> = {
  classic: {
    label: 'Classic',
    branch: ['#333399', '#008080', '#33cccc', '#000080', '#008000', '#c0c0c0', '#ccffff', '#ffff99', '#ffcc99', '#666699', '#3366ff', '#00ffff', '#ff6600', '#993366', '#993300', '#99cc00', '#ffcc00', '#ff99cc', '#808080', '#800080', '#00ccff', '#ffff00', '#ff00ff', '#800000', '#ff0000', '#00ff00', '#0000ff', '#ffa500', '#000000', '#ffffff'],
    border: ['#264653', '#2a9d8f', '#1d3557', '#2b2d42', '#386641', '#6c757d', '#577590', '#8d99ae', '#8c564b', '#495057', '#3a86ff', '#0077b6', '#e76f51', '#7b2cbf', '#9c6644', '#6a994e', '#b08900', '#b56576', '#6d6875', '#5a189a'],
    background: ['#ffffff', '#f8f9fa', '#f1faee', '#fefae0', '#fff1e6', '#edf6f9', '#e9f5db', '#fdf0d5', '#f8edeb', '#faf3dd', '#eef7f2', '#eef4ff'],
    connect: ['#1d3557', '#457b9d', '#2a9d8f', '#6a994e', '#bc6c25', '#e76f51', '#9d4edd', '#7f5539', '#6d597a', '#3a86ff'],
    font: ['#111111', '#1d3557', '#264653', '#3d405b', '#4a4e69', '#5f0f40', '#6b705c', '#2b2d42', '#003049', '#2d3142'],
  },
  rainbow: {
    label: 'Rainbow',
    branch: ['#e63946', '#ff7f11', '#ffbe0b', '#8ac926', '#2ec4b6', '#00bbf9', '#3a86ff', '#8338ec', '#ff006e', '#ef476f', '#06d6a0', '#118ab2', '#f72585', '#7209b7', '#4361ee', '#4cc9f0', '#f3722c', '#90be6d', '#43aa8b', '#577590'],
    border: ['#b5172f', '#c05621', '#b08900', '#5a8f29', '#1d8a85', '#0077b6', '#1d4ed8', '#6d28d9', '#be185d', '#a4133c'],
    background: ['#fff5f5', '#fff7ed', '#fffbeb', '#f7fee7', '#ecfeff', '#eff6ff', '#f5f3ff', '#fdf2f8', '#f0fdf4', '#eef2ff'],
    connect: ['#e63946', '#ff7f11', '#8ac926', '#2ec4b6', '#3a86ff', '#8338ec', '#ff006e', '#06d6a0', '#f3722c', '#577590'],
    font: ['#111111', '#9b2226', '#7f4f24', '#386641', '#0f766e', '#1d4ed8', '#5b21b6', '#be185d', '#1f2937', '#334155'],
  },
  vintage: {
    label: 'Vintage',
    branch: ['#E08A96', '#95BB64', '#E29EC6', '#DCB127', '#A159C5', '#F7941D', '#74AAA9', '#F36E53', '#7ABCD9', '#A78345', '#7AD9C4', '#C2B59B'],
    border: ['#726658'],
    background: ['#ffffff', '#f8f9fa', '#f1faee', '#fefae0', '#fff1e6', '#edf6f9', '#e9f5db'],
    connect: ['#E08A96', '#95BB64', '#E29EC6', '#DCB127', '#A159C5', '#F7941D', '#74AAA9'],
    font: ['#000000', '#E08A96', '#95BB64', '#E29EC6', '#DCB127', '#A159C5', '#F7941D'],
  },
}

let activeThemeName: ThemeName = 'classic'

export function getThemeNames(): ThemeName[] {
  return Object.keys(COLOR_THEMES) as ThemeName[]
}

export function getActiveThemeName(): ThemeName {
  return activeThemeName
}

export function getTheme(name: ThemeName): ColorTheme {
  return COLOR_THEMES[name] ?? COLOR_THEMES.classic
}

export function setColorTheme(name: ThemeName): void {
  activeThemeName = COLOR_THEMES[name] ? name : 'classic'
  try {
    localStorage.setItem(COLOR_THEME_KEY, activeThemeName)
  } catch {
    // ignore
  }
}

export function loadPersistedColorTheme(): void {
  try {
    const saved = localStorage.getItem(COLOR_THEME_KEY) as ThemeName | null
    activeThemeName = saved && COLOR_THEMES[saved] ? saved : 'classic'
  } catch {
    activeThemeName = 'classic'
  }
}

export function getColorByIndex(colors: string[], index: number): string {
  if (!colors.length) return '#000000'
  const i = ((index % colors.length) + colors.length) % colors.length
  return colors[i]
}

export function getThemeBranchColor(index: number): string {
  return getColorByIndex(getTheme(activeThemeName).branch, index)
}

export function getNextRootBranchColor(rootChildCount: number): string {
  return getThemeBranchColor(rootChildCount)
}
