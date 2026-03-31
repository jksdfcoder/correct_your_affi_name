import { Settings, ChevronDown } from 'lucide-react';
import { useAuthorStore } from '@/stores/author-store';
import { applyPreset } from '@/lib/template-renderer';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { TemplatePreset, SuperscriptStyle, TemplateConfig } from '@/types';

export function SettingsPanel() {
  const templateConfig = useAuthorStore((s) => s.templateConfig);
  const setTemplateConfig = useAuthorStore((s) => s.setTemplateConfig);

  const handlePresetChange = (preset: TemplatePreset) => {
    const presetConfig = applyPreset(preset);
    setTemplateConfig({ ...presetConfig, preset });
  };

  const handleSuperscriptStyleChange = (style: SuperscriptStyle) => {
    setTemplateConfig({ superscriptStyle: style, preset: 'custom' });
  };

  const handleToggle = (key: keyof TemplateConfig, value: boolean) => {
    setTemplateConfig({ [key]: value, preset: 'custom' });
  };

  const handleSeparatorChange = (sep: ',' | '.') => {
    setTemplateConfig({ separator: sep, preset: 'custom' });
  };

  const handleHkSuffixChange = (suffix: TemplateConfig['hkSuffix']) => {
    setTemplateConfig({ hkSuffix: suffix });
  };

  const isCustom = templateConfig.preset === 'custom';

  return (
    <div className="flex flex-col h-full bg-background border-l">
      {/* Header */}
      <div className="p-4 border-b bg-card flex items-center gap-2 sticky top-0 z-10">
        <Settings className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Template Preset */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Template Preset</Label>
          <RadioGroup
            value={templateConfig.preset}
            onValueChange={(v: string) => handlePresetChange(v as TemplatePreset)}
            className="grid grid-cols-2 gap-2"
          >
            {(['nature', 'ieee', 'apa', 'custom'] as const).map((preset) => (
              <div key={preset} className="flex items-center space-x-2">
                <RadioGroupItem value={preset} id={`preset-${preset}`} />
                <Label
                  htmlFor={`preset-${preset}`}
                  className="text-sm capitalize cursor-pointer"
                >
                  {preset}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Superscript Style */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Superscript Style</Label>
          <RadioGroup
            value={templateConfig.superscriptStyle}
            onValueChange={(v: string) => handleSuperscriptStyleChange(v as SuperscriptStyle)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="numeric" id="style-numeric" />
              <Label htmlFor="style-numeric" className="text-sm cursor-pointer">
                Numeric (1, 2, 3)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="alphabetic" id="style-alphabetic" />
              <Label htmlFor="style-alphabetic" className="text-sm cursor-pointer">
                Alphabetic (a, b, c)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="symbol" id="style-symbol" />
              <Label htmlFor="style-symbol" className="text-sm cursor-pointer">
                Symbol (*, †, ‡)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Field Toggles */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Include Fields</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="include-faculty" className="text-sm cursor-pointer">
                Faculty
              </Label>
              <Switch
                id="include-faculty"
                checked={templateConfig.includeFaculty}
                onCheckedChange={(v: boolean) => handleToggle('includeFaculty', v)}
                disabled={!isCustom}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-department" className="text-sm cursor-pointer">
                Department
              </Label>
              <Switch
                id="include-department"
                checked={templateConfig.includeDepartment}
                onCheckedChange={(v: boolean) => handleToggle('includeDepartment', v)}
                disabled={!isCustom}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-lab" className="text-sm cursor-pointer">
                Lab / Centre
              </Label>
              <Switch
                id="include-lab"
                checked={templateConfig.includeLab}
                onCheckedChange={(v: boolean) => handleToggle('includeLab', v)}
                disabled={!isCustom}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-hospital" className="text-sm cursor-pointer">
                Hospital
              </Label>
              <Switch
                id="include-hospital"
                checked={templateConfig.includeHospital}
                onCheckedChange={(v: boolean) => handleToggle('includeHospital', v)}
                disabled={!isCustom}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-zipcode" className="text-sm cursor-pointer">
                Zip Code
              </Label>
              <Switch
                id="include-zipcode"
                checked={templateConfig.includeZipcode}
                onCheckedChange={(v: boolean) => handleToggle('includeZipcode', v)}
                disabled={!isCustom}
              />
            </div>
          </div>
          {!isCustom && (
            <p className="text-xs text-muted-foreground">
              Select "Custom" preset to edit toggles
            </p>
          )}
        </div>

        <Separator />

        {/* Separator Style */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Separator</Label>
          <RadioGroup
            value={templateConfig.separator}
            onValueChange={(v: string) => handleSeparatorChange(v as ',' | '.')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="," id="sep-comma" />
              <Label htmlFor="sep-comma" className="text-sm cursor-pointer">
                Comma (,)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="." id="sep-period" />
              <Label htmlFor="sep-period" className="text-sm cursor-pointer">
                Period (.)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Hong Kong Suffix */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Hong Kong Suffix</Label>
          <Select
            value={templateConfig.hkSuffix}
            onValueChange={(v: string) => handleHkSuffixChange(v as TemplateConfig['hkSuffix'])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hong Kong">Hong Kong</SelectItem>
              <SelectItem value="Hong Kong, China">Hong Kong, China</SelectItem>
              <SelectItem value="Hong Kong SAR, China">Hong Kong SAR, China</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Advanced: Symbols */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="symbols" className="border-none">
            <AccordionTrigger className="text-sm font-medium py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                Symbol Customization
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="co-first-symbol" className="text-xs text-muted-foreground">
                  Co-first author symbol
                </Label>
                <Input
                  id="co-first-symbol"
                  value={templateConfig.coFirstSymbol}
                  onChange={(e) => setTemplateConfig({ coFirstSymbol: e.target.value })}
                  className="h-8"
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="corresponding-symbol" className="text-xs text-muted-foreground">
                  Corresponding author symbol
                </Label>
                <Input
                  id="corresponding-symbol"
                  value={templateConfig.correspondingSymbol}
                  onChange={(e) => setTemplateConfig({ correspondingSymbol: e.target.value })}
                  className="h-8"
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="co-first-footnote" className="text-xs text-muted-foreground">
                  Co-first author footnote
                </Label>
                <Input
                  id="co-first-footnote"
                  value={templateConfig.coFirstFootnote}
                  onChange={(e) => setTemplateConfig({ coFirstFootnote: e.target.value })}
                  className="h-8"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
