// app/study/cgpa/calculate/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import type { CGPACalculationInput, CGPAResult } from "@/types/study";

const gradePoints: Record<string, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D+": 1.3, "D": 1.0, "F": 0.0,
};

export default function CalculateCGPAPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<{ name: string; creditHours: number; grade: string }[]>([
    { name: "", creditHours: 3, grade: "A" },
  ]);
  const [result, setResult] = useState<CGPAResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addRow = () => {
    setCourses([...courses, { name: "", creditHours: 3, grade: "A" }]);
  };

  const removeRow = (i: number) => {
    if (courses.length === 1) return;
    setCourses(courses.filter((_, idx) => idx !== i));
  };

  const updateCourse = (i: number, field: keyof typeof courses[0], value: string | number) => {
    const updated = [...courses];
    (updated[i] as any)[field] = value;
    setCourses(updated);
  };

  const handleCalculate = async () => {
    if (courses.some(c => !c.name || c.creditHours <= 0)) {
      setError("Please fill in all course names and valid credit hours.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: CGPACalculationInput = { courses };
      const res = await apiPost("/cgpa/calculate", payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calculate CGPA</h1>
        <p className="text-muted-foreground">Enter your courses and grades to compute your CGPA</p>
      </div>

      <Card>
        <CardContent className="p-6">
          {error && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-destructive text-sm mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {courses.map((c, i) => (
              <div key={i} className="flex flex-wrap items-end gap-3 border-b border-border pb-4 last:border-0">
                <div className="flex-1 min-w-[150px]">
                  <Label className="text-xs">Course Name</Label>
                  <Input
                    value={c.name}
                    onChange={(e) => updateCourse(i, "name", e.target.value)}
                    placeholder="e.g., Math 101"
                  />
                </div>
                <div className="w-20">
                  <Label className="text-xs">Credits</Label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={c.creditHours}
                    onChange={(e) => updateCourse(i, "creditHours", Number(e.target.value))}
                  />
                </div>
                <div className="w-24">
                  <Label className="text-xs">Grade</Label>
                  <Select
                    value={c.grade}
                    onValueChange={(val) => updateCourse(i, "grade", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(gradePoints).map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(i)}
                  disabled={courses.length === 1}
                  className="text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" onClick={addRow} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>

            <Button onClick={handleCalculate} disabled={loading} className="w-full">
              {loading ? "Calculating..." : "Calculate CGPA"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Your Calculated CGPA</p>
            <p className="text-5xl font-bold text-primary mt-2">{result.cgpa.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Credits: {result.totalCredits}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}