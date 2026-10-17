import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import api from "../../api/axios";
import type { Post } from "../../api/types";

export function LikeButton({ post }: { post: Post }) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async () => (await api.post<{ liked: boolean; likes_count: number }>(`/posts/${post.slug}/like/`)).data,
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ["post", post.slug] });
            const previous = queryClient.getQueryData<Post>(["post", post.slug]);
            queryClient.setQueriesData<Post>({ queryKey: ["post"] }, (current) =>
                current?.slug === post.slug ? { ...current, is_liked: !current.is_liked, likes_count: Math.max(0, current.likes_count + (current.is_liked ? -1 : 1)) } : current,
            );
            return { previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) queryClient.setQueryData(["post", post.slug], context.previous);
            void queryClient.invalidateQueries({ queryKey: ["post", post.slug] });
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["post", post.slug] }),
    });
    return (
        <button className={`like-button ${post.is_liked ? "is-liked" : ""}`} type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()} aria-pressed={post.is_liked}>
            <Heart size={18} fill={post.is_liked ? "currentColor" : "none"} /> {post.likes_count} <span>Appreciate</span>
        </button>
    );
}
