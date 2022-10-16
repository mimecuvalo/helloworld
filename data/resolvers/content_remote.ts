import {
  ContentRemoteResolvers,
  DeleteContentRemoteMutationVariables,
  FavoriteContentRemoteMutationVariables,
  FetchContentRemotePaginatedQueryVariables,
  MarkAllContentInFeedAsReadMutationVariables,
  MutationPostCommentArgs,
  QueryFetchCommentsRemoteArgs,
  QueryFetchContentRemoteArgs,
  QueryFetchFavoritesRemoteArgs,
  ReadContentRemoteMutationVariables,
} from 'data/graphql-generated';
import { isAdmin, isAuthor } from './authorization';

import { Context } from 'data/context';
import { Prisma } from '@prisma/client';
import { combineResolvers } from 'graphql-resolvers';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const contentRemote = {
  // ContentRemote: {
  //   // XXX wtf is this?
  //   // @ts-ignore
  //   __resolveType(contentRemote, context, info) {
  //     return contentRemote.type[0].toUpperCase() + contentRemote.type.slice(1);
  //   },
  // },

  Query: {
    // eslint-disable-next-line
    allContentRemote: combineResolvers(
      isAdmin,
      async (parent: ContentRemoteResolvers, args: any, { prisma }: Context) => {
        return await prisma.contentRemote.findMany();
      }
    ),

    fetchContentRemote: combineResolvers(
      isAdmin,
      async (parent: ContentRemoteResolvers, { id }: QueryFetchContentRemoteArgs, { prisma }: Context) => {
        return await prisma.contentRemote.findUnique({ where: { id } });
      }
    ),

    // TODO: re-add 'query'
    fetchContentRemotePaginated: combineResolvers(
      isAuthor,
      async (
        parent: ContentRemoteResolvers,
        { profileUrlOrSpecialFeed, offset, shouldShowAllItems }: FetchContentRemotePaginatedQueryVariables,
        { currentUsername, prisma }: Context
      ) => {
        const take = 20;

        const constraints: { [key: string]: string | boolean } = {
          toUsername: currentUsername,
          deleted: false,
          isSpam: false,
        };
        let order: Prisma.SortOrder = 'desc';

        switch (profileUrlOrSpecialFeed) {
          case 'favorites':
            constraints.favorited = true;
            break;
          case 'comments':
            constraints.type = 'comment';
            break;
          default:
            if (profileUrlOrSpecialFeed) {
              constraints.fromUsername = profileUrlOrSpecialFeed;
              const userRemote = await prisma.userRemote.findUnique({
                select: { sortType: true },
                where: {
                  localUsername_profileUrl: { localUsername: currentUsername, profileUrl: profileUrlOrSpecialFeed },
                },
              });
              if (userRemote?.sortType === 'oldest') {
                order = 'asc';
              }
            }
            constraints.type = 'post';
            if (!shouldShowAllItems) {
              constraints.read = false;
            }
            break;
        }

        let results = await prisma.contentRemote.findMany({
          where: constraints,
          orderBy: [{ createdAt: order }],
          take,
          skip: offset * take,
        });

        // So, a funny UI behavior quirk of having an infinite RSS feed that has the user scrolling while
        // marking things as read as this messes with your offset limits. Set offset to 0 if we found no results
        // the first time.
        if (!results.length && offset !== 0) {
          results = await prisma.contentRemote.findMany({
            where: constraints,
            orderBy: [{ createdAt: 'desc' }],
            take,
            skip: 0,
          });
        }
        return results;
      }
    ),

    // eslint-disable-next-line
    fetchUserTotalCounts: combineResolvers(
      isAuthor,
      async (parent: ContentRemoteResolvers, args: any, { currentUsername, prisma }: Context) => {
        const commonConstraints: { [key: string]: string | boolean } = {
          toUsername: currentUsername,
          deleted: false,
          isSpam: false,
        };

        const commentsCount = await prisma.contentRemote.count({
          where: Object.assign({}, commonConstraints, { type: 'comment' }),
        });

        const favoritesCount = await prisma.contentRemote.count({
          where: Object.assign({}, commonConstraints, { favorited: true }),
        });

        const totalCount = await prisma.contentRemote.count({
          where: Object.assign({}, commonConstraints, { type: 'post', read: false }),
        });

        return {
          commentsCount,
          favoritesCount,
          totalCount,
        };
      }
    ),

    // eslint-disable-next-line
    fetchFeedCounts: combineResolvers(
      isAuthor,
      async (parent: ContentRemoteResolvers, args: any, { currentUsername, prisma }: Context) => {
        const result = await prisma.contentRemote.groupBy({
          by: ['fromUsername'],
          _count: true,
          where: { toUsername: currentUsername, deleted: false, isSpam: false, read: false, type: 'post' },
        });

        return result;
      }
    ),

    async fetchCommentsRemote(
      parent: ContentRemoteResolvers,
      { username, name }: QueryFetchCommentsRemoteArgs,
      { prisma }: Context
    ) {
      const result = await prisma.contentRemote.findMany({
        select: {
          avatar: true,
          creator: true,
          content: true,
          createdAt: true,
          deleted: true,
          favorited: true,
          fromUsername: true,
          link: true,
          localContentName: true,
          postId: true,
          type: true,
          username: true,
          view: true,
        },
        where: {
          toUsername: username || '',
          localContentName: name,
          deleted: false,
          isSpam: false,
          type: 'comment',
        },
        orderBy: [{ createdAt: 'desc' }],
      });

      return result;
    },

    async fetchFavoritesRemote(
      parent: ContentRemoteResolvers,
      { username, name }: QueryFetchFavoritesRemoteArgs,
      { prisma }: Context
    ) {
      const result = await prisma.contentRemote.findMany({
        select: {
          avatar: true,
          createdAt: true,
          fromUsername: true,
          localContentName: true,
          postId: true,
          type: true,
          username: true,
        },
        where: {
          toUsername: username || '',
          localContentName: name,
          deleted: false,
          isSpam: false,
          type: 'favorite',
        },
        orderBy: [{ createdAt: 'desc' }],
      });

      return result;
    },
  },

  Mutation: {
    postComment: async (
      parent: ContentRemoteResolvers,
      { username, name, content }: MutationPostCommentArgs,
      { currentUserEmail, currentUserPicture, prisma, req }: Context
    ) => {
      const localUrl = `/${username}/remote-comments/comment-${uuidv4()}`;
      const tagDate = new Date().toISOString().slice(0, 10);
      const postId = `tag:${req.headers.host},${tagDate}:${localUrl}`;
      const link = `${req.headers.origin}${localUrl}`;

      const commentUsername = currentUserEmail.split('@')[0];
      const md5 = crypto.createHash('md5');
      const emailHash = md5.update(`mailto:${currentUserEmail}`).digest('hex');
      const gravatar = `http://www.gravatar.com/avatar/${emailHash}`;
      const avatar = currentUserPicture || gravatar;

      // const createdRemoteContent = await prisma.contentRemote.create({
      //   avatar,
      //   comment_user: currentUserEmail,
      //   content,
      //   fromUser: null,
      //   link,
      //   localContentName: name,
      //   postId,
      //   title: '',
      //   toUsername: username,
      //   type: 'comment',
      //   username: commentUsername,
      //   view: content,
      // });

      const commentedContent = await prisma.content.findUnique({
        select: { id: true, hidden: true, commentsCount: true },
        where: { username_name: { username, name } },
      });
      await prisma.content.update({
        data: {
          commentsCount: (commentedContent?.commentsCount || 0) + 1,
          commentsUpdated: new Date(),
        },
        where: { id: commentedContent?.id },
      });
      // const updatedCommentedContent = await prisma.content.findUnique({ where: { id: commentedContent?.id } });
      // const contentOwner = await prisma.user.findUnique({ where: { username } });

      if (!commentedContent?.hidden) {
        // // TODO(mime): hacky - how can we unify this (here and wherever we use syndicate())
        // contentOwner.url = profileUrl(contentOwner.username, req);
        // updatedCommentedContent.url = contentUrl(updatedCommentedContent, req);
        // await socialButterfly().syndicate(
        //   req,
        //   contentOwner,
        //   updatedCommentedContent,
        //   createdRemoteContent,
        //   true /* isComment */
        // );
      }

      return {
        avatar,
        content,
        deleted: false,
        favorited: false,
        fromUser: null,
        link,
        localContentName: name,
        postId,
        toUsername: username,
        type: 'comment',
        username: commentUsername,
      };
    },

    favoriteContentRemote: combineResolvers(
      isAuthor,
      async (
        parent: ContentRemoteResolvers,
        { fromUsername, postId, type, favorited }: FavoriteContentRemoteMutationVariables,
        { currentUsername, prisma }: Context
      ) => {
        const remoteContentWhere = {
          toUsername_fromUsername_postId: {
            toUsername: currentUsername,
            fromUsername,
            postId,
          },
        };
        await prisma.contentRemote.update({ data: { favorited }, where: remoteContentWhere });
        // const contentRemote = await prisma.contentRemote.findOne({ where: remoteContentWhere });
        // const userRemote = await prisma.userRemote.findOne({
        //   where: {
        //     localUsername: currentUsername,
        //     profile_url: contentRemote.fromUsername,
        //   },
        // });

        // // TODO(mime): hacky - how can we unify this (here and wherever we use syndicate())
        // currentUser.model.url = profileUrl(currentUsername, req);
        // socialButterfly().like(req, currentUser.model, contentRemote, userRemote, favorited);

        return { fromUsername, postId, type, favorited };
      }
    ),

    deleteContentRemote: combineResolvers(
      isAuthor,
      async (
        parent: ContentRemoteResolvers,
        { fromUsername, postId, localContentName, type, deleted }: DeleteContentRemoteMutationVariables,
        { currentUsername, prisma }: Context
      ) => {
        const where = {
          toUsername_fromUsername_postId: {
            toUsername: currentUsername,
            fromUsername,
            postId,
          },
        };
        await prisma.contentRemote.update({ data: { deleted }, where });

        const localContentWhere = { username_name: { username: currentUsername, name: localContentName } };
        const commentedContent = await prisma.content.findUnique({
          select: { commentsCount: true },
          where: localContentWhere,
        });
        await prisma.content.update({
          data: {
            commentsCount: (commentedContent?.commentsCount || 0) + (deleted ? -1 : 1),
          },
          where: localContentWhere,
        });

        return { fromUsername, postId, localContentName, type, deleted };
      }
    ),

    markAllContentInFeedAsRead: combineResolvers(
      isAuthor,
      async (
        parent: ContentRemoteResolvers,
        { fromUsername }: MarkAllContentInFeedAsReadMutationVariables,
        { currentUsername, prisma }: Context
      ) => {
        await prisma.contentRemote.updateMany({
          data: {
            read: true,
          },

          where: {
            toUsername: currentUsername,
            fromUsername,
          },
        });

        return { fromUsername, count: 0 };
      }
    ),

    // eslint-disable-next-line
    markAllFeedsAsRead: combineResolvers(
      isAuthor,
      async (parent: ContentRemoteResolvers, args: any, { currentUsername, prisma }: Context) => {
        await prisma.contentRemote.updateMany({ data: { read: true }, where: { toUsername: currentUsername } });
        return { count: 0 };
      }
    ),

    readContentRemote: combineResolvers(
      isAuthor,
      async (
        parent: ContentRemoteResolvers,
        { fromUsername, postId, read }: ReadContentRemoteMutationVariables,
        { currentUsername, prisma }: Context
      ) => {
        await prisma.contentRemote.update({
          data: {
            read,
          },

          where: {
            toUsername_fromUsername_postId: {
              toUsername: currentUsername,
              fromUsername,
              postId,
            },
          },
        });

        return { fromUsername, postId, read };
      }
    ),
  },
};

export default contentRemote;
