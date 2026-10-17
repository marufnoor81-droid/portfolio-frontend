import { ArrowUpRight, Clock3, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import type { Post } from "../../api/types";

export function PostCard({ post }: { post: Post }) {
    return (
        <article className="post-card">
            <Link className={`post-cover ${post.cover_image ? "has-image" : ""}`} to={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}>
                {post.cover_image ? <img src={post.cover_image} alt="" loading="lazy" /> : <span className="cover-letter">{post.category?.name.slice(0, 1) ?? "J"}</span>}
                <span className="cover-label">{post.category?.name ?? "Journal"} <ArrowUpRight size={15} /></span>
            </Link>
            <div className="post-meta"><span>{post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Draft"}</span><span><Clock3 size={13} /> {post.reading_time} min read</span></div>
            <h3><Link to={`/blog/${post.slug}`}>{post.title}</Link></h3>
            <p>{post.excerpt}</p>
            <div className="post-card-foot"><span><Eye size={14} /> {post.views_count}</span><span>{post.likes_count} appreciations</span></div>
        </article>
    );
}
