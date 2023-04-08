import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { PageLayout } from "~/components/PageLayout";
import { PostView } from "~/components/PostView";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { api } from "~/utils/api";

const SinglePostPage: NextPage<{ postId: string }> = ({ postId }) => {
  const { data } = api.posts.getById.useQuery({
    postId,
  });
  if (!data) return <div>404 error</div>;
  return (
    <>
      <Head>
        <title>{`${data.post.content} - ${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <PostView key={data.post.id} {...data} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const postId = context.params?.id;
  if (typeof postId !== "string") throw new Error("no id");
  const ssg = generateSSGHelper();
  await ssg.posts.getById.prefetch({ postId });
  return {
    props: {
      trpcState: ssg.dehydrate(),
      postId,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};
export default SinglePostPage;
