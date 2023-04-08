import { type NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";

const ProfilePage: NextPage = (e) => {
  const a = useRouter();
  console.log("route", a);
  return (
    <>
      <Head>
        <title>Twitter App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="w-full border-x border-slate-400  md:max-w-2xl">
          <div className="flex border-b border-slate-400 p-4"></div>
        </div>
      </main>
    </>
  );
};

export default ProfilePage;