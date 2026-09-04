import { Link } from "@tanstack/react-router"

export default function UnderConstruction() {
  return (
    <div className="m-auto flex min-h-svh flex-col items-center justify-center">
      under construction
      <Link to="/" className="hover:text-green-600">
        take me back home!
      </Link>
    </div>
  )
}
