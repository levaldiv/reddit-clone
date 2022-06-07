import Avatar from './Avatar'
import client from '../apollo-client'
import { useSession } from 'next-auth/react'
import { LinkIcon, PhotographIcon } from '@heroicons/react/outline'
import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { ADD_POST, ADD_SUBREDDIT } from '../graphql/mutations'
import { GET_ALL_POSTS, GET_SUBREDDIT_BY_TOPIC } from '../graphql/queries'
import toast from 'react-hot-toast'

type FormData = {
  postTitle: string
  postBody: string
  postImage: string
  subreddit: string
}

type Props = {
  subreddit?: string
}

function PostBox({ subreddit }: Props) {
  // const PostBox = ({ subreddit }: Props) => {
  const { data: session } = useSession()
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>()
  const [imgBoxOpen, setImgBoxOpen] = useState<boolean>(false)
  const [addPost] = useMutation(ADD_POST, {
    refetchQueries: [GET_ALL_POSTS, 'getPostList'],
  })
  const [addSubreddit] = useMutation(ADD_SUBREDDIT)

  const onSubmit = handleSubmit(async (formData) => {
    const notification = toast.loading('CREATING NEW POST...')

    /** Making GET req to check if a subreddit has already been created, if it hasnt, create it and get back the ID
     * otherwise just get the ID and use it in the addPost mutation
     */

    try {
      // query for the subreddit topic
      // query to see if subreddit exists
      const {
        data: { getSubredditListByTopic },
      } = await client.query({
        query: GET_SUBREDDIT_BY_TOPIC,
        variables: {
          topic: subreddit || formData.subreddit,
        },
      })

      // if the subreddit exists
      const subredditExists = getSubredditListByTopic.length > 0

      if (!subredditExists) {
        // create the subreddit ...

        const {
          data: { insertSubreddit: newSubreddit },
        } = await addSubreddit({
          variables: {
            topic: formData.subreddit,
          },
        })

        const image = formData.postImage || '' // protecting from when a post doesnty havw an image

        const {
          data: { insertPost: newPost },
        } = await addPost({
          variables: {
            body: formData.postBody,
            image: image,
            subreddit_id: newSubreddit.id,
            title: formData.postTitle,
            username: session?.user?.name,
          },
        })
      } else {
        // use existing subreddit

        const image = formData.postImage || ''

        const {
          data: { insertPost: newPost },
        } = await addPost({
          variables: {
            body: formData.postBody,
            image: image,
            subreddit_id: getSubredditListByTopic[0].id, // fetched
            title: formData.postTitle,
            username: session?.user?.name,
          },
        })
      }

      // After the post hasd been added, reset the form
      setValue('postBody', '')
      setValue('postImage', '')
      setValue('postTitle', '')
      setValue('subreddit', '')

      toast.success('NEW POST CREATED!', {
        id: notification,
      })
    } catch (error) {
      // console.log(error)
      toast.error('WHOOPS! SOMETHING WENT WRONG!', {
        id: notification,
      })
    }
  })

  return (
    <form
      onSubmit={onSubmit}
      className="sticky top-20 z-50 rounded-md border border-gray-50 bg-white p-2"
    >
      <div className="flex items-center space-x-3">
        {/* avatar */}
        <Avatar seed="your-custom-seed" />

        <input
          {...register('postTitle', { required: true })}
          type="text"
          disabled={!session}
          className="flex-1 rounded-md bg-gray-50 p-2 pl-5 outline-none"
          placeholder={
            session
              ? subreddit
                ? `Create a post in r/${subreddit}`
                : 'Create a post'
              : 'Please sign in'
          }
        />

        <PhotographIcon
          onClick={() => setImgBoxOpen(!imgBoxOpen)}
          className={`h-6 cursor-pointer text-gray-300 ${
            imgBoxOpen && 'text-blue-300'
          }`}
        />
        <LinkIcon className="h-6 text-gray-300" />
      </div>

      {/* this will show the other fields when the user starts typing */}
      {!!watch('postTitle') && (
        <div className="flex flex-col py-2">
          {/* Body */}
          <div className="flex items-center px-2">
            <p className="min-w-[90px]">Body:</p>
            <input
              className="m-2 flex-1 bg-blue-50 p-2 outline-none"
              {...register('postBody')}
              type="text"
              placeholder="Text (optional)"
            />
          </div>

          {!subreddit && (
            <div className="flex items-center px-2">
              <p className="min-w-[90px]">Subreddit:</p>
              <input
                className="m-2 flex-1 bg-blue-50 p-2 outline-none"
                {...register('subreddit', { required: true })}
                type="text"
                placeholder="i.e. NextJS"
              />
            </div>
          )}

          {imgBoxOpen && (
            <div className="flex items-center px-2">
              <p className="min-w-[90px]">Image URL:</p>
              <input
                className="m-2 flex-1 bg-blue-50 p-2 outline-none"
                {...register('postImage')}
                type="text"
                placeholder="Optional..."
              />
            </div>
          )}

          {/* Handling the Errors */}
          {Object.keys(errors).length > 0 && (
            <div className="space-y-2 p-2 text-red-500">
              {errors.postTitle?.type === 'required' && (
                <p>- A Post Title is required</p>
              )}

              {errors.subreddit?.type === 'required' && (
                <p>- A Subreddit is required</p>
              )}
            </div>
          )}

          {!!watch('postTitle') && (
            <button
              type="submit"
              className="w-full rounded-full bg-blue-400 p-2 text-white"
            >
              Create Post
            </button>
          )}
        </div>
      )}
    </form>
  )
}

export default PostBox
