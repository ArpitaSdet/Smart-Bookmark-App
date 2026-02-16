"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Home() {
  

  const [user, setUser] = useState<any>(null)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const fetchBookmarks = async () => {
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.log(error)
  } else {
    setBookmarks(data)
  }
}



  // Get logged in user
  useEffect(() => {
  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      fetchBookmarks()
    }
  }

  getUser()
}, [])

  // Login function
  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    })
  }

  // Add bookmark
  const addBookmark = async () => {
    if (!title || !url) {
      alert("Please fill all fields")
      return
    }

    const { error } = await supabase.from("bookmarks").insert([
      {
        title,
        url,
        user_id: user.id,
      },
    ])

    if (!error) {
  alert("Bookmark added successfully")
  setTitle("")
  setUrl("")
  fetchBookmarks()   // 🔥 refresh list
}

  }
  const deleteBookmark = async (id: string) => {
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", id)

  if (error) {
    console.log("Delete error:", error)
  } else {
    fetchBookmarks() // refresh list after delete
  }
}

  useEffect(() => {
  const channel = supabase
    .channel("bookmarks")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookmarks",
      },
      () => {
        fetchBookmarks()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])



  return (
  <div style={{ textAlign: "center", marginTop: "50px" }}>
    {user ? (
      <div>
        <h2>Welcome {user.email}</h2>

        <div style={{ marginTop: "20px" }}>
          <input
            type="text"
            placeholder="Enter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <br /><br />

          <input
            type="text"
            placeholder="Enter URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <br /><br />

          <button onClick={addBookmark}>
            Add Bookmark
          </button>
        </div>

        {/* ✅ ADD THIS BELOW THE FORM */}
        <div style={{ marginTop: "30px" }}>
          <h3>My Bookmarks</h3>
          <ul>
  {bookmarks.map((bookmark) => (
    <li key={bookmark.id}>
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {bookmark.title}
      </a>

      <button
        onClick={() => deleteBookmark(bookmark.id)}
        style={{ marginLeft: "10px", color: "red" }}
      >
        Delete
      </button>
    </li>
  ))}
</ul>

        </div>

      </div>
    ) : (
      <button onClick={login}>
        Login with Google
      </button>
    )}
  </div>
)
}
