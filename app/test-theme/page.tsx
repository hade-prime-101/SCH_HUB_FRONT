'use client';

import { ThemeToggle } from '@/app/ui/theme-toggle';
import { useTheme } from '@/app/ui/theme-provider';

export default function TestThemePage() {
  const { theme, resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-3xl font-bold mb-6">Theme Test Page</h1>
      
      <div className="mb-6">
        <ThemeToggle />
      </div>

      <div className="mb-8">
        <p className="mb-2">Current theme: <span className="font-semibold">{theme}</span></p>
        <p>Resolved theme: <span className="font-semibold">{resolvedTheme}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Card Surface</h2>
          <p className="text-muted-foreground">This is a card with card foreground text.</p>
        </div>
        
        <div className="bg-muted p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Muted Surface</h2>
          <p className="text-muted-foreground">This is a muted background with muted foreground text.</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Feature Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-category-timetable-bg p-4 rounded-lg">
            <div className="text-category-timetable font-semibold">Timetable</div>
          </div>
          <div className="bg-category-planner-bg p-4 rounded-lg">
            <div className="text-category-planner font-semibold">Planner</div>
          </div>
          <div className="bg-category-events-bg p-4 rounded-lg">
            <div className="text-category-events font-semibold">Events</div>
          </div>
          <div className="bg-category-ai-bg p-4 rounded-lg">
            <div className="text-category-ai font-semibold">AI</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90">
            Primary Button
          </button>
          <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:bg-secondary/90">
            Secondary Button
          </button>
          <button className="bg-destructive text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-destructive/90">
            Destructive Button
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Inputs</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Text Input</label>
            <input type="text" className="w-full border border-input bg-background px-3 py-2 rounded-md" placeholder="Enter text..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Select</label>
            <select className="w-full border border-input bg-background px-3 py-2 rounded-md">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}