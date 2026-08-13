// app/dashboard/study/page.tsx
"use client";

import Link from "next/link";
import { BookOpen, FileUp, Brain, BarChart3, Users, Award } from "lucide-react";

export default function StudyOverviewPage() {
  const cards = [
    {
      href: "/dashboard/study/materials",
      title: "Materials",
      description: "Browse & manage study materials",
      icon: BookOpen,
      color: "bg-primary/10 text-primary",
      border: "border-primary/20",
    },
    {
      href: "/dashboard/study/materials/upload",
      title: "Upload Materials",
      description: "Add new study resources",
      icon: FileUp,
      color: "bg-success/5 text-success",
      border: "border-success/20",
    },
    {
      href: "/dashboard/study/quizzes",
      title: "Quizzes",
      description: "Practice & test your knowledge",
      icon: Brain,
      color: "bg-purple-50 text-purple-600",
      border: "border-purple-200",
    },
    {
      href: "/dashboard/study/personal",
      title: "Personal AI Study",
      description: "AI-powered tutoring sessions",
      icon: Users,
      color: "bg-orange-50 text-orange-600",
      border: "border-orange-200",
    },
    {
      href: "/dashboard/study/cgpa",
      title: "CGPA Calculator",
      description: "Track your academic progress",
      icon: Award,
      color: "bg-red-50 text-red-600",
      border: "border-red-200",
    },
    {
      href: "/dashboard/study/summaries",
      title: "Summaries",
      description: "AI-generated study summaries",
      icon: BarChart3,
      color: "bg-indigo-50 text-indigo-600",
      border: "border-indigo-200",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Study Centre</h1>
        <p className="text-lg text-gray-600">Manage materials, take quizzes, and track your academic progress</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group block p-6 rounded-lg border-2 ${card.border} bg-white hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}
            >
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h2>
              <p className="text-gray-600 text-sm">{card.description}</p>
              <div className="mt-4 text-primary text-sm font-medium group-hover:translate-x-1 transition-transform inline-block">
                Get started →
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats Section */}
      <div className="mt-12 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-8 border border-primary/20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Study Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">📚 Upload Materials</h3>
            <p className="text-sm text-gray-700">Share your study materials with the community and help others learn</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">🧠 AI Tutoring</h3>
            <p className="text-sm text-gray-700">Use Personal AI Study for interactive tutoring and personalized learning</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">📊 Track Progress</h3>
            <p className="text-sm text-gray-700">Monitor your CGPA and quiz scores to stay on top of your academics</p>
          </div>
        </div>
      </div>
    </div>
  );
}