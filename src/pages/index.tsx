import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import toast from "react-hot-toast";
import { Button } from "~/components/Button";
import { type RouterOutputs, api } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { Loading } from "~/components/Loading";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { PageLayout } from "~/components/PageLayout";
dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const [content, setContent] = useState("");
  if (!user) return <div>Log in to post</div>;
  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setContent("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0], {
          position: "bottom-center",
          duration: 2500,
        });
      } else {
        toast.error("Failed to post.", {
          position: "bottom-center",
          duration: 2500,
        });
      }
    },
  });
  return (
    <div className="flex w-full gap-3">
      <Image
        className="h-12 w-12 rounded-full"
        width={48}
        height={48}
        src={user.profileImageUrl}
        alt="user profile picture"
      />
      <input
        type="text"
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isPosting}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (content !== "") {
              mutate({ content });
            }
          }
        }}
      />
      <Button
        onClick={() => mutate({ content })}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (content !== "") {
              mutate({ content });
            }
          }
        }}
        disabled={isPosting}
      >
        {!isPosting ? (
          "Post"
        ) : (
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Please wait
          </div>
        )}
      </Button>
    </div>
  );
};
type PostWithAuthor = RouterOutputs["posts"]["getAll"][number];
const PostView = (props: PostWithAuthor) => {
  const { post, author } = props;
  return (
    <div className="flex items-center gap-4 border-b border-slate-400 p-4">
      <Image
        width={48}
        height={48}
        className="h-12 w-12 rounded-full"
        alt="user profile picture"
        src={author.profileImageUrl}
      />
      <div className="flex flex-col">
        <div className="flex text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <span className="px-2">•</span>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{dayjs(post.createdAt).fromNow()}</span>
          </Link>
        </div>
        <span className="text-xl">{post.content}</span>
      </div>
    </div>
  );
};
const Feed = () => {
  const { data, isLoading } = api.posts.getAll.useQuery();
  if (isLoading) return <Loading size={60} />;
  if (!data) return <div>Something went wrong</div>;
  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView key={fullPost.post.id} {...fullPost} />
      ))}
    </div>
  );
};
const Home: NextPage = () => {
  const user = useUser();
  api.posts.getAll.useQuery();

  if (!user.isLoaded) return null;

  return (
    <>
      <PageLayout>
        <div className="flex border-b border-slate-400 p-4">
          {!user.isSignedIn && (
            <div className="flex justify-center">
              <SignInButton mode="modal" />
            </div>
          )}
          {user.isSignedIn && (
            <div className="w-full">
              <CreatePostWizard />
              <SignOutButton />
            </div>
          )}
        </div>
        <Feed />
      </PageLayout>
    </>
  );
};

export default Home;
