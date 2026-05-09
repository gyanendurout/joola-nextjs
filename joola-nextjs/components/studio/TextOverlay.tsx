'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export type FontSize = 'small' | 'medium' | 'large' | 'xl'
export type Position = 'top' | 'center' | 'bottom'
export type CornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type TextColor = 'white' | 'black' | 'cyan' | 'gold' | 'custom'
export type TextStyle = 'normal' | 'bold' | 'italic'

export type TextLayer = {
  text: string
  fontSize: FontSize
  position: Position
  color: TextColor
  customColor: string
  style: TextStyle
}

export type BadgeLayer = {
  text: string
  position: CornerPosition
  enabled: boolean
}

export type SubTextLayer = TextLayer & { enabled: boolean }

export type OverlayConfig = {
  headline: TextLayer
  subtext: SubTextLayer
  badge: BadgeLayer
}

export const DEFAULT_OVERLAY: OverlayConfig = {
  headline: {
    text: '',
    fontSize: 'large',
    position: 'bottom',
    color: 'white',
    customColor: '#ffffff',
    style: 'bold',
  },
  subtext: {
    text: '',
    fontSize: 'small',
    position: 'bottom',
    color: 'white',
    customColor: '#ffffff',
    style: 'normal',
    enabled: false,
  },
  badge: {
    text: '',
    position: 'top-right',
    enabled: false,
  },
}

// ── CSS helpers ─────────────────────────────────────────────────────────
export const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: 'text-sm',
  medium: 'text-xl',
  large: 'text-3xl',
  xl: 'text-5xl',
}

export const COLOR_MAP: Record<TextColor, string> = {
  white: '#ffffff',
  black: '#000000',
  cyan: '#00d4ff',
  gold: '#f5c242',
  custom: '',
}

export const CORNER_MAP: Record<CornerPosition, string> = {
  'top-left': 'top-3 left-3',
  'top-right': 'top-3 right-3',
  'bottom-left': 'bottom-3 left-3',
  'bottom-right': 'bottom-3 right-3',
}

export const POSITION_ALIGN: Record<Position, string> = {
  top: 'top-0 left-0 right-0',
  center: 'top-1/2 left-0 right-0 -translate-y-1/2',
  bottom: 'bottom-0 left-0 right-0',
}

// ── Sub-components ───────────────────────────────────────────────────────
function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1">
      {options.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
            value === key
              ? 'bg-[#1a5cff]/20 text-[#00d4ff] border-[#1a5cff]/40'
              : 'bg-[#0a0a0f] text-[#64748b] border-[#1e1e2e] hover:text-[#94a3b8] hover:border-[#334155]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function ColorPicker({
  value,
  customColor,
  onChange,
  onCustomChange,
}: {
  value: TextColor
  customColor: string
  onChange: (c: TextColor) => void
  onCustomChange: (hex: string) => void
}) {
  const COLORS: { key: TextColor; bg: string; label: string }[] = [
    { key: 'white', bg: '#ffffff', label: 'W' },
    { key: 'black', bg: '#000000', label: 'B' },
    { key: 'cyan', bg: '#00d4ff', label: 'C' },
    { key: 'gold', bg: '#f5c242', label: 'G' },
  ]
  return (
    <div className="flex items-center gap-2">
      {COLORS.map(({ key, bg, label }) => (
        <button
          key={key}
          type="button"
          title={key}
          onClick={() => onChange(key)}
          className={`w-6 h-6 rounded-full border-2 transition-all ${
            value === key ? 'border-[#00d4ff] scale-110' : 'border-transparent hover:border-[#334155]'
          }`}
          style={{ backgroundColor: bg }}
        >
          <span className="sr-only">{label}</span>
        </button>
      ))}
      <div className="flex items-center gap-1.5 ml-1">
        <input
          type="color"
          value={customColor}
          onChange={(e) => { onChange('custom'); onCustomChange(e.target.value) }}
          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
          title="Custom color"
        />
        <span className="text-[10px] text-[#475569]">Custom</span>
      </div>
    </div>
  )
}

function TextLayerControls({
  label,
  layer,
  onUpdate,
}: {
  label: string
  layer: TextLayer
  onUpdate: (patch: Partial<TextLayer>) => void
}) {
  return (
    <div className="space-y-2.5">
      <div className="space-y-1.5">
        <label className="text-[10px] font-medium text-[#64748b] uppercase tracking-wide">{label}</label>
        <input
          type="text"
          value={layer.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder={label === 'Main Headline' ? 'e.g. NEW DROP  or  IPBL EDITION' : 'e.g. Available now on joola.com'}
          className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-xs text-white placeholder-[#334155] focus:outline-none focus:border-[#00d4ff] transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <p className="text-[9px] text-[#475569] uppercase tracking-wide">Size</p>
          <ToggleGroup
            options={[
              { key: 'small' as FontSize, label: 'S' },
              { key: 'medium' as FontSize, label: 'M' },
              { key: 'large' as FontSize, label: 'L' },
              { key: 'xl' as FontSize, label: 'XL' },
            ]}
            value={layer.fontSize}
            onChange={(v) => onUpdate({ fontSize: v })}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[9px] text-[#475569] uppercase tracking-wide">Position</p>
          <ToggleGroup
            options={[
              { key: 'top' as Position, label: 'Top' },
              { key: 'center' as Position, label: 'Mid' },
              { key: 'bottom' as Position, label: 'Bot' },
            ]}
            value={layer.position}
            onChange={(v) => onUpdate({ position: v })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[9px] text-[#475569] uppercase tracking-wide">Style</p>
        <ToggleGroup
          options={[
            { key: 'normal' as TextStyle, label: 'Normal' },
            { key: 'bold' as TextStyle, label: 'Bold' },
            { key: 'italic' as TextStyle, label: 'Italic' },
          ]}
          value={layer.style}
          onChange={(v) => onUpdate({ style: v })}
        />
      </div>

      <div className="space-y-1">
        <p className="text-[9px] text-[#475569] uppercase tracking-wide">Color</p>
        <ColorPicker
          value={layer.color}
          customColor={layer.customColor}
          onChange={(c) => onUpdate({ color: c })}
          onCustomChange={(hex) => onUpdate({ customColor: hex })}
        />
      </div>
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────────────
interface TextOverlayProps {
  config: OverlayConfig
  onChange: (config: OverlayConfig) => void
}

export default function TextOverlay({ config, onChange }: TextOverlayProps) {
  const [subtextOpen, setSubtextOpen] = useState(false)
  const [badgeOpen, setBadgeOpen] = useState(false)

  const updateHeadline = (patch: Partial<TextLayer>) =>
    onChange({ ...config, headline: { ...config.headline, ...patch } })

  const updateSubtext = (patch: Partial<SubTextLayer>) =>
    onChange({ ...config, subtext: { ...config.subtext, ...patch } })

  const updateBadge = (patch: Partial<BadgeLayer>) =>
    onChange({ ...config, badge: { ...config.badge, ...patch } })

  return (
    <div className="space-y-4">
      {/* Headline */}
      <TextLayerControls label="Main Headline" layer={config.headline} onUpdate={updateHeadline} />

      {/* Subtext toggle */}
      <div className="border border-[#1e1e2e] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setSubtextOpen((v) => !v)
            updateSubtext({ enabled: !config.subtext.enabled })
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#0d0d14] hover:bg-[#13131a] transition-colors"
        >
          <span className="text-xs font-medium text-[#94a3b8]">Add Subtext</span>
          {subtextOpen ? (
            <ChevronUp size={13} className="text-[#475569]" />
          ) : (
            <ChevronDown size={13} className="text-[#475569]" />
          )}
        </button>
        {subtextOpen && (
          <div className="p-3.5 border-t border-[#1e1e2e] bg-[#0a0a0f]">
            <TextLayerControls label="Sub Text" layer={config.subtext} onUpdate={updateSubtext} />
          </div>
        )}
      </div>

      {/* Badge toggle */}
      <div className="border border-[#1e1e2e] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setBadgeOpen((v) => !v)
            updateBadge({ enabled: !config.badge.enabled })
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#0d0d14] hover:bg-[#13131a] transition-colors"
        >
          <span className="text-xs font-medium text-[#94a3b8]">Add Badge / Tag</span>
          {badgeOpen ? (
            <ChevronUp size={13} className="text-[#475569]" />
          ) : (
            <ChevronDown size={13} className="text-[#475569]" />
          )}
        </button>
        {badgeOpen && (
          <div className="p-3.5 border-t border-[#1e1e2e] bg-[#0a0a0f] space-y-2.5">
            <input
              type="text"
              value={config.badge.text}
              onChange={(e) => updateBadge({ text: e.target.value })}
              placeholder="e.g. LIMITED EDITION"
              className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg text-xs text-white placeholder-[#334155] focus:outline-none focus:border-[#00d4ff] transition-colors"
            />
            <div className="space-y-1">
              <p className="text-[9px] text-[#475569] uppercase tracking-wide">Position</p>
              <ToggleGroup
                options={[
                  { key: 'top-left' as CornerPosition, label: '↖ TL' },
                  { key: 'top-right' as CornerPosition, label: 'TR ↗' },
                  { key: 'bottom-left' as CornerPosition, label: '↙ BL' },
                  { key: 'bottom-right' as CornerPosition, label: 'BR ↘' },
                ]}
                value={config.badge.position}
                onChange={(v) => updateBadge({ position: v })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
