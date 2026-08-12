"use client";
import { useEffect, useState } from "react";
import { getBookmarks } from "@/lib/api/users.api";
import type { Bookmark } from "@/types/users";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  useEffect(() => { getBookmarks().then(setBookmarks); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bookmarks</h1>
      {bookmarks.length === 0 ? <p>No bookmarks.</p> : (
        <ul className="space-y-2">
          {bookmarks.map(b => (
            <li key={b.id} className="bg-white shadow rounded p-3">
              {b.targetType}: {b.targetId}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}