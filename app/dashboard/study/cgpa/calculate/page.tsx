// app/dashboard/study/cgpa/calculate/page.tsx
"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import type { CGPACalculationInput, CGPAResult } from "@/types/study";

const gradePoints: Record<string, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D+": 1.3, "D": 1.0, "F": 0.0,
};

export default function CalculateCGPAPage() {
  const [courses, setCourses] = useState<{ name: string; creditHours: number; grade: string }[]>([
    { name: "", creditHours: 3, grade: "A" },
  ]);
  const [result, setResult] = useState<CGPAResult | null>(null);
  const [error, setError] = useState("");

  const addRow = () => {
    setCourses([...courses, { name: "", creditHours: 3, grade: "A" }]);
  };

  const removeRow = (i: number) => {
    setCourses(courses.filter((_, idx) => idx !== i));
  };

  const updateCourse = (i: number, field: keyof { name: string; creditHours: number; grade: string }, value: string | number) => {
    const updated = [...courses];
    (updated[i] as any)[field] = value;
    setCourses(updated);
  };

  const handleCalculate = async () => {
    if (courses.some(c => !c.name || c.creditHours <= 0)) {
      setError("Please fill in all course names and valid credit hours.");
      return;
    }
    try {
      const res = await apiPost("/cgpa/calculate", { courses });
      setResult(res);
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Calculate CGPA</h1>

      {error && (
        <div className="bg-destructive/5 border border-destructive/20 text-destructive p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded p-6">
        {courses.map((c, i) => (
          <div key={i} className="flex gap-3 mb-4 items-end border-b pb-4">
            <div className="flex-1">
              <label className="block text-sm mb-1">Course Name</label>
              <input
                type="text"
                value={c.name}
                onChange={e => updateCourse(i, "name", e.target.value)}
                className="border p-2 w-full"
                placeholder="e.g. Math 101"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm mb-1">Credits</label>
              <input
                type="number"
                min={1}
                max={6}
                value={c.creditHours}
                onChange={e => updateCourse(i, "creditHours", Number(e.target.value))}
                className="border p-2 w-full"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm mb-1">Grade</label>
              <select
                value={c.grade}
                onChange={e => updateCourse(i, "grade", e.target.value)}
                className="border p-2 w-full"
              >
                {Object.keys(gradePoints).map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => removeRow(i)}
              className="text-destructive hover:text-destructive/80 mb-1"
              disabled={courses.length === 1}
            >
              ✕
            </button>
          </div>
        ))}

        <div className="flex justify-between">
          <button onClick={addRow} className="text-primary hover:underline">
            + Add another course
          </button>
          <button onClick={handleCalculate} className="bg-success text-white px-6 py-2 rounded">
            Calculate
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 bg-primary/5 border border-primary/20 rounded p-6 text-center">
          <p className="text-lg">Your CGPA</p>
          <p className="text-5xl font-bold text-primary">{result.cgpa.toFixed(2)}</p>
          <p className="text-gray-600 mt-1">Total Credits: {result.totalCredits}</p>
        </div>
      )}
    </div>
  );
}