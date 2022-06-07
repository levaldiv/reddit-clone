import {
  ArrowDownIcon,
  ArrowUpIcon,
  BookmarkIcon,
  ChatAltIcon,
  DotsHorizontalIcon,
  GiftIcon,
  ShareIcon,
} from '@heroicons/react/outline'
import Avatar from './Avatar'
import TimeAgo from 'react-timeago'
import Link from 'next/link'
import { Jelly } from '@uiball/loaders'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { GET_ALL_VOTES_BY_POST_ID } from '../graphql/queries'
import { ADD_VOTE } from '../graphql/mutations'

type Props = {
  post: Post
}

function Post({ post }: Props) {
  // const Post = ({ post }: Props) => {
  const [vote, setVote] = useState<boolean>()
  const { data: session } = useSession()

  // get votes
  const { data, loading } = useQuery(GET_ALL_VOTES_BY_POST_ID, {
    variables: {
      post_id: post?.id,
    },
  })

  const [addVote] = useMutation(ADD_VOTE, {
    refetchQueries: [GET_ALL_VOTES_BY_POST_ID, 'getVotesByPostId'],
  })

  const upVote = async (isUpvote: boolean) => {
    const notification = toast.loading('Voting ...')
    if (!session) {
      toast.error('You need to sign in to Vote!')
      return
    }

    if (vote && isUpvote) {
      toast.success('You already voted!', { id: notification })
      return
    }

    if (vote === false && !isUpvote) {
      toast.success('You already voted!', { id: notification })
      return
    }

    // performing the vote
    await addVote({
      variables: {
        post_id: post?.id,
        username: session?.user?.name,
        upvote: isUpvote,
      },
    })
    toast.success('Successfully voted!', { id: notification })
  }

  useEffect(() => {
    const votes: Vote[] = data?.getVotesByPostId

    // latest vote (sorted by newly created firsdt in sql)
    const vote = votes?.find(
      (vote) => vote.username == session?.user?.name
    )?.upvote

    setVote(vote)
  }, [data])

  const displayVote = (data: any) => {
    const votes: Vote[] = data?.getVotesByPostId
    const dispNum = votes?.reduce(
      (total, vote) => (vote.upvote ? (total += 1) : (total -= 1)),
      0
    )

    // if no one has voted yet
    if (votes?.length === 0) return 0

    if (dispNum === 0) {
      // the last vote made
      return votes[0]?.upvote ? 1 : -1
    }
    return dispNum
  }

  if (!post) {
    return (
      <div className="flex w-full items-center justify-center pt-20 text-xl">
        <Jelly size={50} color="#FF4501" />
      </div>
    )
  }

  return (
    <Link href={`/post/${post.id}`}>
      <div className="flex cursor-pointer rounded-md border border-gray-300 bg-white shadow-sm hover:border hover:border-gray-600">
        {/* Votes */}
        <div className="flex flex-col items-center justify-start space-y-1 rounded-l-md bg-gray-50 p-4 text-gray-400">
          <ArrowUpIcon
            className={`voteBtn hover:text-blue-400 ${vote && 'text-red-400'}`}
            onClick={() => upVote(true)}
          />
          <p className="text-xs font-bold text-black">{displayVote(data)}</p>
          <ArrowDownIcon
            onClick={() => upVote(false)}
            className={`voteBtn hover:text-red-400 ${
              vote === false && 'text-blue-400'
            }`}
          />
        </div>

        {/* <div></div> */}

        <div className="p-3 pb-1">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <Avatar seed={post.subreddit[0]?.topic} />
            <p className="text-xs text-gray-400">
              <Link href={`/subreddit/${post.subreddit[0]?.topic}`}>
                <span className="font-bold text-black hover:text-blue-400 hover:underline">
                  r/{post.subreddit[0]?.topic}
                </span>
              </Link>

              <span> • Posted by u/{post.username} ⏳ </span>
              <TimeAgo date={post.created_at} />
            </p>
          </div>

          {/* Body */}
          <div className="py-4">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-sm font-light">{post.body}</p>
          </div>

          {/* Image */}
          <img src={post.image} className="w-full" alt="" />

          {/* Footer */}
          <div className="flex space-x-4 text-gray-400">
            <div className="postBtns">
              <ChatAltIcon className="h-6 w-6" />
              <p className="">{post.comments.length} Comments</p>
            </div>
            <div className="postBtns">
              <GiftIcon className="h-6 w-6" />
              <p className="hidden sm:inline">Award</p>
            </div>
            <div className="postBtns">
              <ShareIcon className="h-6 w-6" />
              <p className="hidden sm:inline">Share</p>
            </div>
            <div className="postBtns">
              <BookmarkIcon className="h-6 w-6" />
              <p className="hidden sm:inline">Save</p>
            </div>
            <div className="postBtns">
              <DotsHorizontalIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default Post
