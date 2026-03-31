import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2, Mail } from 'lucide-react';

import { Author } from '@/types';
import { useAuthorStore } from '@/stores/author-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { InstitutionPicker } from './InstitutionPicker';

interface AuthorCardProps {
  author: Author;
}

export function AuthorCard({ author }: AuthorCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: author.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.7 : 1,
  };

  const updateAuthor = useAuthorStore(state => state.updateAuthor);
  const removeAuthor = useAuthorStore(state => state.removeAuthor);
  const removeAffiliation = useAuthorStore(state => state.removeAffiliation);
  const institutions = useAuthorStore(state => state.institutions);

  const [name, setName] = useState(author.name);
  const [email, setEmail] = useState(author.email || '');
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleNameBlur = () => {
    if (name !== author.name) {
      updateAuthor(author.id, { name });
    }
  };

  const handleEmailBlur = () => {
    if (email !== author.email) {
      updateAuthor(author.id, { email });
    }
  };

  const getAffiliationShortName = (instId: string) => {
    const inst = institutions.get(instId);
    if (!inst) return 'Unknown';
    if (inst.source === 'hku') {
      return inst.components.department || inst.components.faculty || inst.components.lab || inst.components.centre || inst.components.school || inst.components.institute || 'HKU';
    }
    return inst.components.university;
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`relative group border overflow-hidden ${isDragging ? 'border-primary ring-1 ring-primary/20 shadow-xl' : 'hover:border-primary/30 shadow-sm'}`}
      >
        <CardContent className="p-0 flex items-stretch">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex items-center px-2 cursor-grab active:cursor-grabbing bg-muted/40 hover:bg-muted/80 text-muted-foreground transition-colors"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          <div className="flex-1 p-4 flex flex-col gap-4">
            {/* Header: Name and Delete */}
            <div className="flex items-center gap-3 justify-between">
              <div className="flex-1 max-w-sm">
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  placeholder="Author Name"
                  className="font-medium text-base border-transparent hover:border-border focus-visible:border-primary focus-visible:ring-1 bg-transparent px-2 -ml-2"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeAuthor(author.id)}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Affiliations */}
            <div className="flex flex-wrap items-center gap-2 min-h-6">
              {author.affiliationIds.map(instId => (
                <Badge
                  key={instId}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                >
                  <span className="text-xs truncate max-w-[200px]">
                    {getAffiliationShortName(instId)}
                  </span>
                  <button
                    onClick={() => removeAffiliation(author.id, instId)}
                    className="hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPickerOpen(true)}
                className="h-7 text-xs border-dashed text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Affiliation
              </Button>
            </div>

            {/* Checkboxes and Email */}
            <div className="flex flex-wrap items-center gap-6 mt-1 pt-4 border-t border-border/50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`co-first-${author.id}`}
                  checked={author.isCoFirst}
                  onCheckedChange={(checked) => updateAuthor(author.id, { isCoFirst: checked === true })}
                />
                <Label htmlFor={`co-first-${author.id}`} className="text-sm cursor-pointer text-muted-foreground">
                  Co-first author
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`corresponding-${author.id}`}
                  checked={author.isCorresponding}
                  onCheckedChange={(checked) => updateAuthor(author.id, { isCorresponding: checked === true })}
                />
                <Label htmlFor={`corresponding-${author.id}`} className="text-sm cursor-pointer text-muted-foreground">
                  Corresponding
                </Label>
              </div>

              {author.isCorresponding && (
                <div className="flex items-center gap-2 flex-1 min-w-[200px] animate-in fade-in slide-in-from-left-2 duration-200">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    placeholder="Email address"
                    className="h-8 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <InstitutionPicker
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        authorId={author.id}
      />
    </>
  );
}
