import Post from "./post"

export default function PostList() {
  return (
    <div className="flex flex-col gap-6 px-4">
      {[1, 2, 3, 4].map((post) => (
        <Post key={post} />
      ))}
    </div>
  )
}
