import { type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

const SinglePostPage: NextPage = () => {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username: "kisnj",
  });
  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>404 error</div>;
  return (
    <>
      <Head>
        <title>Post</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div className="w-full border-x border-slate-400  md:max-w-2xl">
          <div className="flex border-b border-slate-400 p-4">
            {data.username}
          </div>
        </div>
      </main>
    </>
  );
};

export default SinglePostPage;
