import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { PageLayout } from "~/components/PageLayout";
import Image from "next/image";
import { PostView } from "~/components/PostView";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { api } from "~/utils/api";

const ProfileFeed = ({ userId }: { userId: string }) => {
  const { data, isLoading } = api.posts.getPostsByUserId.useQuery({ userId });
  if (isLoading) return <div>Loading...</div>;
  if (!data || data.length === 0) return <div>{`User hasn't posted yet!`}</div>;
  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView key={fullPost.post.id} {...fullPost} />
      ))}
    </div>
  );
};

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data: author } = api.profile.getUserByUsername.useQuery({
    username,
  });
  if (!author) return <div>404 error</div>;
  return (
    <>
      <Head>
        <title>{author.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-36 gap-4 bg-slate-600 p-4">
          <Image
            width={128}
            height={128}
            className="absolute bottom-0 left-0 -m-8 -mb-[64px] ml-4 rounded-full border-4 border-black"
            alt="user profile picture"
            src={author.profileImageUrl}
          />
        </div>
        <div className="h-[64px]"></div>
        <div className="border-b border-slate-400 p-4 text-2xl font-bold">{`@${
          author.username ?? ""
        }`}</div>
        <ProfileFeed userId={author.id} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const slug = context.params?.slug;
  if (typeof slug !== "string") throw new Error("no slug");
  const username = slug.slice(1);
  const ssg = generateSSGHelper();
  await ssg.profile.getUserByUsername.prefetch({ username });
  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};
export default ProfilePage;
