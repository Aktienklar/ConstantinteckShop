import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-20 text-center">
      <p className="text-5xl" aria-hidden>
        🥐
      </p>
      <h1 className="mt-4 font-display text-3xl font-bold">
        This page does not exist
      </h1>
      <p className="mx-auto mt-3 max-w-md text-mocha">
        Maybe the link from the video has changed. The search will find you any
        recipe in a couple of seconds.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/recipes" className="btn-primary">
          Search recipes
        </Link>
        <Link href="/" className="btn-secondary">
          Back home
        </Link>
      </div>
    </div>
  );
}
