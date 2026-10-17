import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ArrowUpRight, AtSign, Github, Globe2, Linkedin, Search, Send, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEducation, useExperience, useCategories, useComments, usePost, usePosts, useProfile, useProject, useProjects, useSkills, useTags, pageResults } from "../api/hooks";
import api, { getErrorMessage } from "../api/axios";
import type { Comment, Project } from "../api/types";
import { LikeButton } from "../components/blog/LikeButton";
import { Helmet } from "../components/ui/Helmet";
import { PostCard } from "../components/blog/PostCard";
import { EmptyState, Pagination, QueryState, SectionHeading } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { useDebounce } from "../hooks/useDebounce";

function InlineError({ error }: { error: unknown }) {
    return error ? <p className="field-error" role="alert">{getErrorMessage(error)}</p> : null;
}

export function HomePage() {
    const profile = useProfile();
    const skills = useSkills({ page_size: 100 });
    const experience = useExperience({ page_size: 100 });
    const projects = useProjects({ is_featured: "true", page: 1, page_size: 3 });
    const posts = usePosts({ page: 1, page_size: 3 });
    const details = [profile, skills, experience, projects, posts];
    const hasError = details.find((query) => query.isError);
    const isLoading = details.some((query) => query.isLoading);

    return (
        <>
            <Helmet><title>Home | Portfolio</title><meta name="description" content="A personal portfolio, projects, and journal." /></Helmet>
            <section className="hero page-wrap">
                <div className="hero-copy">
                    <p className="eyebrow"><span className="status-dot" /> {profile.data?.is_available_for_hire ? "Available for select opportunities" : "An independent portfolio & journal"}</p>
                    <h1>{profile.data?.full_name || "Ideas become useful things."}<br /><span className="serif-accent">{profile.data?.headline || "Designed with intention."}</span></h1>
                    <p className="hero-description">{profile.data?.bio || "A place for real work, thoughtful experiments, and notes from the process. The owner can add their profile and work in the private dashboard."}</p>
                    <div className="hero-actions">
                        <Link className="button button-dark" to="/projects">Explore projects <ArrowRight size={16} /></Link>
                        {profile.data?.resume && <a className="text-link" href={profile.data.resume} target="_blank" rel="noreferrer">Download résumé <ArrowUpRight size={15} /></a>}
                    </div>
                    <div className="social-links" aria-label="Social links">
                        {profile.data?.github_url && <a href={profile.data.github_url} aria-label="GitHub" target="_blank" rel="noreferrer"><Github size={17} /></a>}
                        {profile.data?.linkedin_url && <a href={profile.data.linkedin_url} aria-label="LinkedIn" target="_blank" rel="noreferrer"><Linkedin size={17} /></a>}
                        {profile.data?.x_url && <a href={profile.data.x_url} aria-label="Social profile" target="_blank" rel="noreferrer"><AtSign size={17} /></a>}
                        {profile.data?.website_url && <a href={profile.data.website_url} aria-label="Website" target="_blank" rel="noreferrer"><Globe2 size={17} /></a>}
                    </div>
                </div>
                <div className="hero-art" role="img" aria-label={profile.data?.avatar ? `${profile.data.full_name} portrait` : "Abstract editorial illustration"}>
                    {profile.data?.avatar ? <img src={profile.data.avatar} alt={`${profile.data.full_name} portrait`} /> : <div className="hero-illustration"><span className="sun-orb" /><span className="hero-orbit" /><span className="hero-hill" /><span className="art-caption">BUILD · LEARN · REPEAT</span></div>}
                    <span className="hero-stamp">{profile.data?.location || "Working everywhere"}</span>
                </div>
                <div className="hero-bottomline"><span>Portfolio / Journal</span><span>{profile.data?.years_of_experience ? `${profile.data.years_of_experience}+ years in practice` : "An ongoing practice"}</span></div>
            </section>

            {(isLoading || hasError) && <section className="page-wrap"><QueryState query={(hasError ?? details.find((query) => query.isLoading))!} label="Loading your portfolio" /></section>}

            <section className="section page-wrap intro-grid">
                <div><p className="eyebrow">A little about me</p><h2>Curious by nature.<br /><span className="serif-accent">Considered</span> by design.</h2></div>
                <div><p className="intro-copy">{profile.data?.bio || "Your biography will appear here when you add it to your owner profile."}</p><Link className="text-link" to="/about">More about me <ArrowRight size={15} /></Link></div>
            </section>

            <section className="section page-wrap">
                <SectionHeading eyebrow="A growing toolkit" title="Skills in" accent="practice" />
                {skills.data && pageResults(skills.data).length ? <div className="skill-grid">
                    {pageResults(skills.data).slice(0, 8).map((skill) => <article className="skill-card" key={skill.id}><div className="skill-card-head"><h3>{skill.name}</h3><span>{skill.proficiency}%</span></div><p>{skill.category.replace("_", " ").toLowerCase()}</p><div className="meter"><span style={{ width: `${skill.proficiency}%` }} /></div></article>)}
                </div> : <EmptyState title="Your skills will take shape here." detail="Add real skills from the owner dashboard." />}
            </section>

            <section className="section section-tint">
                <div className="page-wrap">
                    <SectionHeading eyebrow="The path so far" title="Good work," accent="good people." />
                    {experience.data && pageResults(experience.data).length ? <div className="timeline">
                        {pageResults(experience.data).slice(0, 3).map((item) => <article className="timeline-row" key={item.id}><span className="timeline-date">{item.start_date.slice(0, 4)} — {item.is_current ? "Now" : item.end_date?.slice(0, 4)}</span><div><h3>{item.role}</h3><p>{item.company}{item.location ? ` · ${item.location}` : ""}</p><p className="muted">{item.description}</p></div></article>)}
                    </div> : <EmptyState title="Your experience timeline is waiting." detail="Add your real experience in the dashboard." />}
                </div>
            </section>

            <section className="section page-wrap">
                <SectionHeading eyebrow="Selected projects" title="Things made" accent="matter." link="See all projects" to="/projects" />
                {projects.data && pageResults(projects.data).length ? <div className="project-grid">
                    {pageResults(projects.data).slice(0, 3).map((project) => <ProjectCard key={project.id} project={project} />)}
                </div> : <EmptyState title="Your first project belongs here." detail="No fictional project work is included. Add your real case studies from the dashboard." />}
            </section>

            <section className="section section-tint">
                <div className="page-wrap">
                    <SectionHeading eyebrow="Fresh from the journal" title="Notes from" accent="the process." link="Read the journal" to="/blog" />
                    {posts.data && pageResults(posts.data).length ? <div className="post-grid">{pageResults(posts.data).slice(0, 3).map((post) => <PostCard key={post.id} post={post} />)}</div> : <EmptyState title="The journal starts with your words." detail="Write and publish original posts from the owner dashboard." />}
                </div>
            </section>
            <ContactBanner />
        </>
    );
}

export function AboutPage() {
    const profile = useProfile();
    const education = useEducation({ page_size: 100 });
    const experience = useExperience({ page_size: 100 });
    const skills = useSkills({ page_size: 100 });
    const queries = [profile, education, experience, skills];
    const loadingQuery = queries.find((query) => query.isLoading);
    const errorQuery = queries.find((query) => query.isError);
    return (
        <div className="page-wrap page-content">
            <Helmet><title>About | Portfolio</title></Helmet>
            {(errorQuery || loadingQuery) && <QueryState query={errorQuery ?? loadingQuery!} label="Loading your profile" />}
            <p className="eyebrow">The person behind the work</p>
            <h1 className="page-title">A little <span className="serif-accent">about me.</span></h1>
            <div className="about-layout">
                <div className="about-portrait">{profile.data?.avatar ? <img src={profile.data.avatar} alt={`${profile.data.full_name} portrait`} /> : <span aria-hidden="true">d.</span>}</div>
                <div className="about-prose"><h2>{profile.data?.headline || "A practice shaped by curiosity."}</h2><p>{profile.data?.bio || "The owner can add their real biography in the private dashboard. No invented career history or credentials are shown here."}</p>{profile.data?.resume && <a className="button button-dark" href={profile.data.resume} target="_blank" rel="noreferrer">Download résumé <ArrowUpRight size={15} /></a>}</div>
            </div>
            <SectionHeading eyebrow="Learning, over time" title="Experience" accent="& education." />
            <div className="timeline">
                {pageResults(experience.data).map((item) => <article className="timeline-row" key={item.id}><span className="timeline-date">{item.start_date.slice(0, 4)} — {item.is_current ? "Now" : item.end_date?.slice(0, 4)}</span><div><h3>{item.role} · {item.company}</h3><p>{item.employment_type.replace("_", " ").toLowerCase()} {item.location && `· ${item.location}`}</p><p className="muted">{item.description}</p></div></article>)}
                {pageResults(education.data).map((item) => <article className="timeline-row" key={`edu-${item.id}`}><span className="timeline-date">{item.start_year} — {item.end_year ?? "Present"}</span><div><h3>{item.degree}{item.field_of_study && `, ${item.field_of_study}`}</h3><p>{item.institution}{item.grade && ` · ${item.grade}`}</p><p className="muted">{item.description}</p></div></article>)}
                {!pageResults(experience.data).length && !pageResults(education.data).length && <EmptyState title="The story is still being written." detail="Add education and experience to your profile." />}
            </div>
            <SectionHeading eyebrow="Tools I reach for" title="Skills in" accent="practice." />
            <div className="skill-grid">{pageResults(skills.data).map((skill) => <article className="skill-card" key={skill.id}><div className="skill-card-head"><h3>{skill.name}</h3><span>{skill.proficiency}%</span></div><p>{skill.category.replace("_", " ").toLowerCase()}</p><div className="meter"><span style={{ width: `${skill.proficiency}%` }} /></div></article>)}</div>
        </div>
    );
}

function ProjectCard({ project }: { project: Project }) {
    return <article className="project-card">
        <Link className={`project-cover ${project.cover_image ? "has-image" : ""}`} to={`/projects/${project.slug}`} aria-label={`View ${project.title}`}>
            {project.cover_image ? <img src={project.cover_image} alt={`Cover for ${project.title}`} loading="lazy" /> : <span aria-hidden="true">{project.title.slice(0, 1)}</span>}
            <span className="project-cover-arrow"><ArrowUpRight size={19} /></span>
        </Link>
        <p className="eyebrow project-category">{project.category}</p>
        <h3><Link to={`/projects/${project.slug}`}>{project.title}</Link></h3>
        <p className="project-summary">{project.summary}</p>
        <ul className="tag-list">{project.tech_stack.map((skill) => <li key={skill.id}>{skill.name}</li>)}</ul>
    </article>;
}

export function ProjectsPage() {
    const [params, setParams] = useSearchParams();
    const search = params.get("search") ?? "";
    const category = params.get("category") ?? "";
    const page = Number(params.get("page") ?? 1);
    const query = useProjects({ search, category, ordering: params.get("ordering") || "-completed_date", page });
    function update(key: string, value: string) {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value); else next.delete(key);
        if (key !== "page") next.delete("page");
        setParams(next);
    }
    const data = query.data;
    return <div className="page-wrap page-content">
        <Helmet><title>Projects | Portfolio</title></Helmet>
        <p className="eyebrow">Selected work</p><h1 className="page-title">Projects made <span className="serif-accent">with purpose.</span></h1>
        <p className="page-intro">A collection of thoughtful builds, experiments, and collaborations.</p>
        <div className="filter-bar">
            <label className="search-field"><Search size={17} /><span className="sr-only">Search projects</span><input value={search} onChange={(event) => update("search", event.target.value)} placeholder="Search projects" /></label>
            <select aria-label="Filter projects by category" value={category} onChange={(event) => update("category", event.target.value)}><option value="">All categories</option>{["WEB", "MOBILE", "API", "ML", "OTHER"].map((item) => <option key={item} value={item}>{item}</option>)}</select>
            <select aria-label="Sort projects" value={params.get("ordering") || "-completed_date"} onChange={(event) => update("ordering", event.target.value)}><option value="-completed_date">Newest</option><option value="display_order">Featured order</option></select>
        </div>
        <QueryState query={query} label="Loading projects" />
        {data && (data.results.length ? <div className="project-grid">{data.results.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <EmptyState title={`No projects found${search ? ` for “${search}”` : ""}.`} detail="Try a different search or category." />)}
        {data && <Pagination page={page} pageCount={Math.max(1, Math.ceil(data.count / 9))} onPage={(next) => update("page", String(next))} />}
    </div>;
}

export function ProjectDetailPage() {
    const { slug = "" } = useParams();
    const query = useProject(slug);
    const project = query.data;
    return <div className="page-wrap page-content">
        <Helmet><title>{project?.title ? `${project.title} | Projects` : "Project | Portfolio"}</title><meta name="description" content={project?.summary ?? "Project details"} /></Helmet>
        <Link className="back-link" to="/projects"><ArrowLeft size={15} /> All projects</Link>
        <QueryState query={query} label="Loading project" />
        {project && <article className="article-shell">
            <p className="eyebrow">{project.category}{project.completed_date ? ` · ${new Date(project.completed_date).getFullYear()}` : ""}</p><h1 className="page-title">{project.title}</h1><p className="article-excerpt">{project.summary}</p>
            {project.cover_image && <img className="article-cover" src={project.cover_image} alt={`Cover for ${project.title}`} />}
            <div className="markdown-content"><ReactMarkdown>{project.description}</ReactMarkdown></div>
            <ul className="tag-list article-tags">{project.tech_stack.map((skill) => <li key={skill.id}>{skill.name}</li>)}</ul>
            <div className="article-actions">{project.live_url && <a className="button button-dark" href={project.live_url} target="_blank" rel="noreferrer">Visit project <ArrowUpRight size={15} /></a>}{project.github_url && <a className="button button-outline" href={project.github_url} target="_blank" rel="noreferrer"><Github size={15} /> Source code</a>}</div>
        </article>}
    </div>;
}

export function BlogPage() {
    const [params, setParams] = useSearchParams();
    const searchParam = params.get("search") ?? "";
    const [input, setInput] = useState(searchParam);
    const debounced = useDebounce(input);
    const category = params.get("category") ?? "";
    const tag = params.get("tag") ?? "";
    const ordering = params.get("ordering") ?? "-published_at";
    const page = Number(params.get("page") ?? 1);
    const query = usePosts({ search: searchParam, "category__slug": category, "tags__slug": tag, ordering, page });
    const categories = useCategories();
    const tags = useTags();
    const { isOwner } = useAuth();
    function update(key: string, value: string) {
        const next = new URLSearchParams(params);
        if (value) next.set(key, value); else next.delete(key);
        if (key !== "page") next.delete("page");
        setParams(next);
    }
    useEffect(() => {
        setInput(searchParam);
    }, [searchParam]);
    useEffect(() => {
        if (debounced === searchParam) return;
        const next = new URLSearchParams(params);
        if (debounced) next.set("search", debounced); else next.delete("search");
        next.delete("page");
        setParams(next, { replace: true });
    }, [debounced, searchParam, params, setParams]);
    const data = query.data;
    return <div className="page-wrap page-content">
        <Helmet><title>Journal | Portfolio</title><meta name="description" content="Notes, ideas, and learnings from the work." /></Helmet>
        <p className="eyebrow">Ideas, in progress</p><h1 className="page-title">The <span className="serif-accent">journal.</span></h1>
        <p className="page-intro">Field notes, useful discoveries, and thoughts worth keeping.</p>
        {isOwner && <p className="owner-note">You are viewing this journal as its owner. <Link to="/dashboard/posts/new">Write a post</Link></p>}
        <div className="filter-bar blog-filters">
            <label className="search-field"><Search size={17} /><span className="sr-only">Search posts</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search the journal" /></label>
            <select aria-label="Filter posts by tag" value={tag} onChange={(event) => update("tag", event.target.value)}><option value="">All tags</option>{pageResults(tags.data).map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select>
            <select aria-label="Sort posts" value={ordering} onChange={(event) => update("ordering", event.target.value)}><option value="-published_at">Newest</option><option value="-views_count">Most viewed</option><option value="-likes_count">Most appreciated</option><option value="title">A–Z</option></select>
        </div>
        <div className="category-chips"><button className={!category ? "is-selected" : ""} type="button" onClick={() => update("category", "")}>All</button>{pageResults(categories.data).map((item) => <button className={category === item.slug ? "is-selected" : ""} key={item.id} type="button" onClick={() => update("category", item.slug)}>{item.name}</button>)}</div>
        <QueryState query={query} label="Loading journal entries" />
        {data && (data.results.length ? <div className="post-grid">{data.results.map((post) => <PostCard key={post.id} post={post} />)}</div> : <EmptyState title={`No posts found${searchParam ? ` for “${searchParam}”` : ""}.`} detail="Try another search or filter." />)}
        {data && <Pagination page={page} pageCount={Math.max(1, Math.ceil(data.count / 6))} onPage={(next) => update("page", String(next))} />}
    </div>;
}

export function BlogPostPage() {
    const { slug = "" } = useParams();
    const query = usePost(slug);
    const comments = useComments(slug);
    const post = query.data;
    const shareMutation = useMutation({ mutationFn: () => navigator.clipboard.writeText(window.location.href) });
    return <div className="page-wrap page-content">
        <Helmet><title>{post?.title ? `${post.title} | Journal` : "Journal | Portfolio"}</title><meta name="description" content={post?.excerpt ?? "Read this journal entry"} /></Helmet>
        <Link className="back-link" to="/blog"><ArrowLeft size={15} /> Back to the journal</Link>
        <QueryState query={query} label="Loading article" />
        {post && <article className="article-shell">
            {post.cover_image && <img className="article-cover" src={post.cover_image} alt={`Cover for ${post.title}`} />}
            <p className="eyebrow">{post.category?.name ?? "Journal"}</p><h1 className="page-title">{post.title}</h1>
            <div className="article-meta"><span>{post.published_at ? new Date(post.published_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : ""}</span><span>{post.reading_time} min read</span><span>{post.views_count} views</span></div>
            <p className="article-excerpt">{post.excerpt}</p>
            <div className="markdown-content"><ReactMarkdown>{post.content}</ReactMarkdown></div>
            <ul className="tag-list article-tags">{post.tags.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
            <div className="article-actions"><LikeButton post={post} /><button className="button button-outline" type="button" onClick={() => shareMutation.mutate()}><Share2 size={15} /> {shareMutation.isSuccess ? "Link copied" : "Copy link"}</button><button className="button button-outline" type="button" onClick={() => { if (navigator.share) void navigator.share({ title: post.title, url: window.location.href }); else shareMutation.mutate(); }}><ArrowUpRight size={15} /> Share</button></div>
            <CommentsSection slug={slug} data={comments.data} isLoading={comments.isLoading} isError={comments.isError} error={comments.error} retry={() => void comments.refetch()} />
            {post.related_posts.length > 0 && <section className="related-posts"><SectionHeading eyebrow="Keep reading" title="More from" accent="this category." /><div className="post-grid">{post.related_posts.map((related) => <article className="related-card" key={related.slug}><p className="eyebrow">{related.reading_time} min read</p><h3><Link to={`/blog/${related.slug}`}>{related.title}</Link></h3><p>{related.excerpt}</p></article>)}</div></section>}
        </article>}
    </div>;
}

function CommentsSection({ slug, data, isLoading, isError, error, retry }: { slug: string; data: ReturnType<typeof useComments>["data"]; isLoading: boolean; isError: boolean; error: unknown; retry: () => void }) {
    const mutation = useMutation({
        mutationFn: async (payload: { name: string; email: string; website: string; content: string; parent: number | null }) => api.post(`/posts/${slug}/comments/`, payload),
    });
    const [form, setForm] = useState<{ name: string; email: string; website: string; content: string; parent: number | null }>({ name: "", email: "", website: "", content: "", parent: null });
    const [feedback, setFeedback] = useState("");
    const commentsList = Array.isArray(data) ? data : data?.results ?? [];
    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFeedback("");
        if (form.name.trim().length < 2 || form.content.trim().length < 5 || form.content.length > 1000) {
            setFeedback("Please enter a name and a comment between 5 and 1000 characters.");
            return;
        }
        try {
            await mutation.mutateAsync(form);
            setFeedback("Your comment is awaiting approval.");
            setForm({ name: "", email: "", website: "", content: "", parent: null });
        } catch (submitError) {
            setFeedback(getErrorMessage(submitError));
        }
    }
    return <section className="comments-section">
        <SectionHeading eyebrow="Join the conversation" title="Leave a" accent="thought." />
        <form className="stacked-form comment-form" onSubmit={(event) => void submit(event)}>
            {form.parent && <div className="reply-context">Replying to a comment <button type="button" onClick={() => setForm({ ...form, parent: null })}>Cancel reply</button></div>}
            <div className="form-row"><label>Your name<input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Email <span>(never shown)</span><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label></div>
            <label>Website <span>(optional)</span><input type="url" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} /></label>
            <label>Your comment<textarea required minLength={5} maxLength={1000} rows={4} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
            <button className="button button-dark" disabled={mutation.isPending} type="submit">{mutation.isPending ? "Sending…" : "Send for review"} <Send size={15} /></button>
            {feedback && <p className="form-feedback" role="status">{feedback}</p>}
        </form>
        <div className="comment-list"><h3>{commentsList.length} approved {commentsList.length === 1 ? "comment" : "comments"}</h3>{isLoading && <p className="muted">Loading comments…</p>}{isError && <div className="field-error">{getErrorMessage(error)} <button type="button" onClick={retry}>Retry</button></div>}
            {commentsList.map((comment) =>             <CommentItem key={comment.id} comment={comment} onReply={() => { setForm({ ...form, parent: comment.id }); document.querySelector(".comment-form textarea")?.scrollIntoView({ behavior: "smooth", block: "center" }); }} />)}
            {!commentsList.length && !isLoading && <p className="muted">No comments have been approved yet.</p>}
        </div>
    </section>;
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply: () => void }) {
    return <article className="comment-item"><div className="comment-avatar">{comment.name.slice(0, 1).toUpperCase()}</div><div><div className="comment-byline"><strong>{comment.website ? <a href={comment.website} target="_blank" rel="noreferrer">{comment.name}</a> : comment.name}</strong><time>{new Date(comment.created_at).toLocaleDateString()}</time></div><p>{comment.content}</p><button className="comment-reply-link" type="button" onClick={onReply}>Reply</button>{comment.replies?.map((reply) => <div className="comment-reply" key={reply.id}><strong>{reply.name}</strong><p>{reply.content}</p></div>)}</div></article>;
}

export function ContactPage() {
    const profile = useProfile();
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const mutation = useMutation({
        mutationFn: async (form: { name: string; email: string; subject: string; message: string }) => api.post("/contact/", form),
        onSuccess: () => setSubmitted(true),
    });
    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const messageText = String(form.get("message") ?? "");
        if (messageText.trim().length < 10 || messageText.length > 2000) {
            setMessage("Please write a message between 10 and 2000 characters.");
            return;
        }
        setMessage("");
        mutation.mutate({ name: String(form.get("name")), email: String(form.get("email")), subject: String(form.get("subject")), message: messageText });
    }
    return <div className="contact-page section-tint">
        <Helmet><title>Contact | Portfolio</title></Helmet>
        <div className="page-wrap contact-layout">
            <div><p className="eyebrow">Your turn</p><h1 className="page-title">Have a good<br /><span className="serif-accent">one in mind?</span></h1><p className="page-intro">Tell me a little about what you’re working on. I’d love to hear about it.</p>{profile.data?.email && <a className="text-link" href={`mailto:${profile.data.email}`}>{profile.data.email} <ArrowUpRight size={15} /></a>}</div>
            <form className="stacked-form contact-form" onSubmit={submit}>
                {submitted ? <div className="success-panel" role="status"><span className="eyebrow">Message received</span><h2>Thanks for reaching out.</h2><p>Your message has been sent to the site owner.</p><button className="button button-outline" type="button" onClick={() => { setSubmitted(false); mutation.reset(); }}>Send another message</button></div> : <>
                    <label>Your name<input required name="name" autoComplete="name" minLength={2} /></label>
                    <label>Email address<input required name="email" type="email" autoComplete="email" /></label>
                    <label>Subject<input required name="subject" minLength={3} /></label>
                    <label>Your message<textarea required name="message" rows={5} minLength={10} maxLength={2000} /></label>
                    <button className="button button-dark" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Sending…" : "Send a note"} <ArrowUpRight size={15} /></button>
                    {message && <p className="field-error" role="alert">{message}</p>}<InlineError error={mutation.error} />
                    {mutation.error && (mutation.error as { response?: { status?: number } }).response?.status === 429 && <p className="field-error">Too many attempts, please try later.</p>}
                    <p className="form-note">Your message goes to the owner’s private inbox. It is not displayed publicly.</p>
                </>}
            </form>
        </div>
    </div>;
}

export function LoginPage() {
    const { login, loading, isOwner } = useAuth();
    const navigate = useNavigate();
    const mutation = useMutation({
        mutationFn: async (values: { username: string; password: string }) => login(values.username, values.password),
        onSuccess: () => {
            const destination = (window.history.state.usr as { from?: string } | undefined)?.from ?? "/dashboard";
            navigate(destination, { replace: true });
        },
    });
    const [error, setError] = useState("");
    if (loading) return <div className="login-wrap"><div className="loading-state">Restoring your session…</div></div>;
    if (isOwner) return <div className="login-wrap"><Link className="button button-dark" to="/dashboard">Open dashboard <ArrowRight size={15} /></Link></div>;
    return <div className="login-wrap">
        <Helmet><title>Owner sign in | Portfolio</title></Helmet>
        <div className="login-card"><p className="eyebrow">Private access</p><h1>Welcome <span className="serif-accent">back.</span></h1><p>Sign in to manage your portfolio and journal.</p>
            <form className="stacked-form" onSubmit={async (event) => { event.preventDefault(); setError(""); const form = new FormData(event.currentTarget); try { await mutation.mutateAsync({ username: String(form.get("username")), password: String(form.get("password")) }); } catch (loginError) { setError(getErrorMessage(loginError)); } }}>
                <label>Username<input name="username" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
                <button className="button button-dark" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Signing in…" : "Sign in"} <ArrowRight size={15} /></button>
                {error && <p className="field-error" role="alert">{error}</p>}
            </form>
            <p className="login-footnote">Owner access only. Public registration is disabled.</p>
        </div>
    </div>;
}

export function NotFoundPage() {
    return <div className="not-found"><p className="eyebrow">404 · Page not found</p><h1>That page took<br /><span className="serif-accent">another path.</span></h1><Link className="button button-dark" to="/">Back to home <ArrowRight size={15} /></Link></div>;
}

function ContactBanner() {
    return <section className="contact-banner"><div className="page-wrap contact-banner-inner"><p className="eyebrow">Something on your mind?</p><h2>Let’s make something <span className="serif-accent">useful.</span></h2><Link className="button button-light" to="/contact">Get in touch <ArrowUpRight size={15} /></Link></div></section>;
}
