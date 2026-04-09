import { useEffect, useState, type ReactNode } from 'react';
import { Settings } from 'lucide-react';
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
import type { TemplatePreset, SuperscriptStyle, TemplateConfig } from '@/types';

type SettingsPanelProps = {
  /** When embedded in App shell with its own collapse chrome, hide duplicate header/border */
  hideOuterChrome?: boolean;
  /** Change this list to make specific sections unfolded by default. */
  defaultOpenSections?: SettingsSectionId[];
};

type SettingsSectionId =
  | 'preset'
  | 'superscript'
  | 'aff-lines'
  | 'separator'
  | 'hk-suffix';

/** Nested accordion inside Superscript Style when Symbol is selected */
const SYMBOL_CUSTOMIZE_VALUE = 'symbol-customize';

export const DEFAULT_FORMATTING_OPEN_SECTIONS: SettingsSectionId[] = [
  'hk-suffix',
  'superscript',
  'separator',
];

function Section({
  value,
  title,
  children,
  description,
}: {
  value: SettingsSectionId;
  title: string;
  children: ReactNode;
  description?: ReactNode;
}) {
  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-card/70 shadow-soft"
    >
      <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline sm:px-5">
        {title}
      </AccordionTrigger>
      <AccordionContent className="space-y-4 border-t border-border/60 px-4 py-4 sm:px-5">
        {description ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

export function SettingsPanel({
  hideOuterChrome = false,
  defaultOpenSections = DEFAULT_FORMATTING_OPEN_SECTIONS,
}: SettingsPanelProps) {
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

  const [symbolCustomizeOpen, setSymbolCustomizeOpen] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (templateConfig.superscriptStyle === 'symbol') {
      setSymbolCustomizeOpen(SYMBOL_CUSTOMIZE_VALUE);
    } else {
      setSymbolCustomizeOpen(undefined);
    }
  }, [templateConfig.superscriptStyle]);

  return (
    <div
      className={
        hideOuterChrome
          ? 'flex h-full min-h-0 flex-col bg-background'
          : 'flex h-full flex-col border-l bg-background'
      }
    >
      {!hideOuterChrome && (
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-card p-4">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto bg-white/50 p-4 sm:p-5">
        <Accordion
          type="multiple"
          defaultValue={defaultOpenSections}
          className="space-y-4"
        >
          <Section
            value="preset"
            title="Template Preset"
            description="Choose a journal-style preset. Selecting any custom control below switches the preset to Custom."
          >
            <RadioGroup
              value={templateConfig.preset}
              onValueChange={(v: string) => handlePresetChange(v as TemplatePreset)}
              className="grid grid-cols-2 gap-2"
            >
              {(['nature', 'ieee', 'apa', 'custom'] as const).map((preset) => (
                <div key={preset} className="flex items-center space-x-2">
                  <RadioGroupItem value={preset} id={`preset-${preset}`} />
                  <Label htmlFor={`preset-${preset}`} className="cursor-pointer text-sm capitalize">
                    {preset}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </Section>

          <Section
            value="hk-suffix"
            title="Geographic location Suffix"
            description="Suffix appended when city is Hong Kong (avoids duplicating “Hong Kong” in the address)."
          >
            <Select
              value={templateConfig.hkSuffix}
              onValueChange={(v: string) => handleHkSuffixChange(v as TemplateConfig['hkSuffix'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pok Fu Lam, Hong Kong SAR, China">
                  Pok Fu Lam, Hong Kong SAR, China
                </SelectItem>
                <SelectItem value="Hong Kong, China">Hong Kong, China</SelectItem>
                <SelectItem value="Hong Kong SAR, China">Hong Kong SAR, China</SelectItem>
                <SelectItem value="Hong Kong">Hong Kong</SelectItem>
              </SelectContent>
            </Select>
          </Section>

          <Section value="superscript" title="Superscript Style">
            <RadioGroup
              value={templateConfig.superscriptStyle}
              onValueChange={(v: string) => handleSuperscriptStyleChange(v as SuperscriptStyle)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="numeric" id="style-numeric" />
                <Label htmlFor="style-numeric" className="cursor-pointer text-sm">
                  Numeric (1, 2, 3)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alphabetic" id="style-alphabetic" />
                <Label htmlFor="style-alphabetic" className="cursor-pointer text-sm">
                  Alphabetic (a, b, c)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="symbol" id="style-symbol" />
                <Label htmlFor="style-symbol" className="cursor-pointer text-sm">
                  Symbol (*, †, ‡)
                </Label>
              </div>
            </RadioGroup>

            {templateConfig.superscriptStyle === 'symbol' ? (
              <Accordion
                type="single"
                collapsible
                value={symbolCustomizeOpen}
                onValueChange={setSymbolCustomizeOpen}
                className="mt-4 rounded-[1rem] border border-border/60 bg-muted/20"
              >
                <AccordionItem value={SYMBOL_CUSTOMIZE_VALUE} className="border-0">
                  <AccordionTrigger className="px-3 py-2.5 text-xs font-semibold hover:no-underline sm:px-4">
                    Symbol Customization
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 border-t border-border/50 px-3 pb-4 pt-3 sm:px-4">
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
            ) : null}
          </Section>

          <Section value="separator" title="Separator">
            <RadioGroup
              value={templateConfig.separator}
              onValueChange={(v: string) => handleSeparatorChange(v as ',' | '.')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="," id="sep-comma" />
                <Label htmlFor="sep-comma" className="cursor-pointer text-sm">
                  Comma (,)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="." id="sep-period" />
                <Label htmlFor="sep-period" className="cursor-pointer text-sm">
                  Period (.)
                </Label>
              </div>
            </RadioGroup>
          </Section>

          <Section
            value="aff-lines"
            title="Affiliation line items"
            description={
              <>
                Choose which parts of an address appear in the rendered affiliation block. Pick the{' '}
                <span className="font-medium text-foreground">Custom</span> template preset to edit
                these.
              </>
            }
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="include-faculty" className="cursor-pointer text-sm font-normal">
                  Faculty
                </Label>
                <Switch
                  id="include-faculty"
                  checked={templateConfig.includeFaculty}
                  onCheckedChange={(v: boolean) => handleToggle('includeFaculty', v)}
                  disabled={!isCustom}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="include-department" className="cursor-pointer text-sm font-normal">
                  Department
                </Label>
                <Switch
                  id="include-department"
                  checked={templateConfig.includeDepartment}
                  onCheckedChange={(v: boolean) => handleToggle('includeDepartment', v)}
                  disabled={!isCustom}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="include-lab" className="cursor-pointer text-sm font-normal">
                  Lab / Centre
                </Label>
                <Switch
                  id="include-lab"
                  checked={templateConfig.includeLab}
                  onCheckedChange={(v: boolean) => handleToggle('includeLab', v)}
                  disabled={!isCustom}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="include-hospital" className="cursor-pointer text-sm font-normal">
                  Hospital
                </Label>
                <Switch
                  id="include-hospital"
                  checked={templateConfig.includeHospital}
                  onCheckedChange={(v: boolean) => handleToggle('includeHospital', v)}
                  disabled={!isCustom}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="include-zipcode" className="cursor-pointer text-sm font-normal">
                  Zip code
                </Label>
                <Switch
                  id="include-zipcode"
                  checked={templateConfig.includeZipcode}
                  onCheckedChange={(v: boolean) => handleToggle('includeZipcode', v)}
                  disabled={!isCustom}
                />
              </div>
            </div>
            {!isCustom ? (
              <p className="text-xs text-muted-foreground">
                Select &quot;Custom&quot; preset to edit these toggles.
              </p>
            ) : null}
          </Section>
        </Accordion>
      </div>
    </div>
  );
}
