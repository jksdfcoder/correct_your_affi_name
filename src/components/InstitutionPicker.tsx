import { useState } from 'react';
import { useHkuDictionary } from '@/hooks/useHkuDictionary';
import { useRorSearch } from '@/hooks/useRorSearch';
import { useAuthorStore } from '@/stores/author-store';
import { buildInstitutionFromUnit } from '@/lib/hku-dictionary';
import { rorToInstitution } from '@/lib/ror-client';
import { Institution } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, Building, Globe2, Plus, Building2 } from 'lucide-react';

interface InstitutionPickerProps {
  authorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstitutionPicker({ authorId, open, onOpenChange }: InstitutionPickerProps) {
  const { dict, search: searchHku } = useHkuDictionary();
  const { results: rorResults, isLoading: rorLoading, search: searchRor } = useRorSearch();
  const addAffiliation = useAuthorStore((state) => state.addAffiliation);
  const hkSuffix = useAuthorStore((state) => state.templateConfig.hkSuffix);

  // Local state for HKU tab
  const [hkuQuery, setHkuQuery] = useState('');
  
  // Local state for external tab
  const [externalQuery, setExternalQuery] = useState('');
  
  // Local state for Custom tab
  const [customName, setCustomName] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customCountry, setCustomCountry] = useState('');

  // Search Results
  const hkuResults = hkuQuery.trim().length > 0 ? searchHku(hkuQuery) : [];

  const handleSelectInstitution = (institution: Institution) => {
    if (authorId) {
      addAffiliation(authorId, institution);
      onOpenChange(false);
      resetState();
    }
  };

  const resetState = () => {
    setHkuQuery('');
    setExternalQuery('');
    setCustomName('');
    setCustomCity('');
    setCustomCountry('');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customCity || !customCountry) return;
    
    const newCustomInstitution: Institution = {
      id: `custom:${Date.now()}`,
      source: 'custom',
      components: {
        university: customName,
        city: customCity,
        country: customCountry,
      }
    };
    
    handleSelectInstitution(newCustomInstitution);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Add Affiliation</DialogTitle>
          <DialogDescription>
            Search for an institution to add to the author's affiliations.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="hku" className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 border-b">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="hku" className="data-[state=active]:bg-background">
                <Building className="w-4 h-4 mr-2" />
                HKU Units
              </TabsTrigger>
              <TabsTrigger value="external" className="data-[state=active]:bg-background">
                <Globe2 className="w-4 h-4 mr-2" />
                External
              </TabsTrigger>
              <TabsTrigger value="custom" className="data-[state=active]:bg-background">
                <Plus className="w-4 h-4 mr-2" />
                Custom
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="hku" className="m-0 flex flex-col gap-4 h-full">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search faculties, departments, labs..." 
                  className="pl-9"
                  value={hkuQuery}
                  onChange={(e) => setHkuQuery(e.target.value)}
                />
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-md">
                {hkuResults.length > 0 ? (
                  <div className="flex flex-col">
                    {hkuResults.map((unit) => (
                      <button
                        key={unit.id}
                        onClick={() => handleSelectInstitution(buildInstitutionFromUnit(dict, unit.id, hkSuffix))}
                        className="flex flex-col items-start gap-1 p-3 text-left border-b last:border-0 hover:bg-accent transition-colors focus:bg-accent focus:outline-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{unit.name}</span>
                          <Badge variant="secondary" className="text-[10px] capitalize px-1 py-0 h-4">
                            {unit.type}
                          </Badge>
                        </div>
                        {unit.aliases.length > 0 && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {unit.aliases.join(' • ')}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : hkuQuery.length > 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-12">
                    No matching units found.
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-12 text-center px-4">
                    <Building2 className="w-12 h-12 mb-4 text-muted/50" />
                    <p>Search the standard HKU dictionary.</p>
                    <p className="text-xs mt-1">Includes faculties, departments, and research centers.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="external" className="m-0 flex flex-col gap-4 h-full">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search ROR registry (e.g., Stanford, Oxford)..." 
                  className="pl-9"
                  value={externalQuery}
                  onChange={(e) => {
                    setExternalQuery(e.target.value);
                    searchRor(e.target.value);
                  }}
                />
              </div>

              <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-md">
                {rorLoading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-12">
                    Searching global registry...
                  </div>
                ) : rorResults.length > 0 ? (
                  <div className="flex flex-col">
                    {rorResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectInstitution(rorToInstitution(result))}
                        className="flex flex-col items-start gap-1 p-3 text-left border-b last:border-0 hover:bg-accent transition-colors focus:bg-accent focus:outline-none"
                      >
                        <span className="font-medium">{result.name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {result.addresses?.[0]?.city && <span>{result.addresses[0].city}, </span>}
                          <span>{result.country.country_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : externalQuery.length > 1 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-12">
                    No institutions found.
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-12 text-center px-4">
                    <Globe2 className="w-12 h-12 mb-4 text-muted/50" />
                    <p>Search the global ROR registry.</p>
                    <p className="text-xs mt-1">Over 100,000 research organizations worldwide.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="m-0 h-full">
              <form onSubmit={handleCustomSubmit} className="flex flex-col gap-5 py-4 min-h-[300px]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inst-name">Institution Name <span className="text-destructive">*</span></Label>
                    <Input 
                      id="inst-name"
                      placeholder="e.g., Independent Researcher" 
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="inst-city">City <span className="text-destructive">*</span></Label>
                      <Input 
                        id="inst-city"
                        placeholder="e.g., Geneva" 
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inst-country">Country <span className="text-destructive">*</span></Label>
                      <Input 
                        id="inst-country"
                        placeholder="e.g., Switzerland" 
                        value={customCountry}
                        onChange={(e) => setCustomCountry(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto pt-6 flex justify-end">
                  <Button type="submit" disabled={!customName || !customCity || !customCountry}>
                    Add Custom Institution
                  </Button>
                </div>
              </form>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
