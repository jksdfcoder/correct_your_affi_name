import { useMemo } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Users } from 'lucide-react';

import { useAuthorStore } from '@/stores/author-store';
import { AuthorCard } from './AuthorCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function AuthorPanel() {
  const authors = useAuthorStore((state) => state.authors);
  const addAuthor = useAuthorStore((state) => state.addAuthor);
  const reorderAuthors = useAuthorStore((state) => state.reorderAuthors);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = authors.findIndex((a) => a.id === active.id);
      const newIndex = authors.findIndex((a) => a.id === over.id);
      reorderAuthors(oldIndex, newIndex);
    }
  };

  const authorIds = useMemo(() => authors.map(a => a.id), [authors]);

  return (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="p-4 border-b bg-card flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Authors</h2>
        </div>
        <Button 
          size="sm" 
          onClick={() => addAuthor('New Author')}
          className="shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Author
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          {authors.length === 0 ? (
            <Card className="border-dashed shadow-none bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Users className="w-12 h-12 mb-4 text-muted/50" />
                <p className="text-base font-medium text-foreground mb-1">No authors yet</p>
                <p className="text-sm max-w-[250px] mb-4">
                  Add authors and assign their affiliations to build your paper's author block.
                </p>
                <Button variant="outline" onClick={() => addAuthor('New Author')}>
                  <Plus className="w-4 h-4 mr-2" /> Add First Author
                </Button>
              </CardContent>
            </Card>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={authorIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-3 pb-8">
                  {authors.map((author) => (
                    <AuthorCard key={author.id} author={author} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}
