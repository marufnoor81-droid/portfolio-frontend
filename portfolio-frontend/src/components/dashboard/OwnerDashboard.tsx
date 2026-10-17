import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, FilePlus2, LayoutDashboard, LogOut, MessageSquare, Pencil, Plus, Send, Settings2, Trash2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api, { getErrorMessage, getFieldErrors } from "../../api/axios";
import { useCategories, useTags } from "../../api/hooks";
import type { DashboardStats, Paginated } from "../../api/types";
import { EmptyState, LoadingState } from "../ui/States";
import { Helmet } from "../ui/Helmet";
import { useAuth } from "../../context/AuthContext";

type Kind = "posts" | "projects" | "skills" | "experience" | "education" | "categories" | "tags" | "comments" | "messages" | "profile";
type Row = Record<string, unknown> & { id?: number; slug?: string; title?: string; name?: string; is_approved?: boolean; is_read?: boolean; status?: string };
type Field = { name: string; label: string; type?: "textarea" | "select" | "checkbox" | "file" | "number" | "date" | "email" | "url"; options?: string[]; required?: boolean };
const EMPTY_FIELDS: Field[] = [];

const managerLabels: Record<Kind, string> = {
    posts: "Posts", projects: "Projects", skills: "Skills", experience: "Experience",
    education: "Education", categories: "Categories", tags: "Tags", comments: "Comments",
    messages: "Messages", profile: "Profile",
};

const managerFields: Record<Exclude<Kind, "comments" | "messages">, Field[]> = {
    posts: [
        { name: "title", label: "Title", required: true }, { name: "excerpt", label: "Excerpt" },
        { name: "content", label: "Markdown content", type: "textarea" },
        { name: "category_id", label: "Category ID (create a category first)", type: "number" },
        { name: "tag_ids", label: "Tag IDs (comma-separated)" },
        { name: "status", label: "Status", type: "select", options: ["DRAFT", "PUBLISHED"] },
        { name: "is_featured", label: "Featured", type: "checkbox" }, { name: "cover_image", label: "Cover image", type: "file" },
    ],
    projects: [
        { name: "title", label: "Title", required: true }, { name: "summary", label: "Summary", required: true },
        { name: "description", label: "Project details", type: "textarea" },
        { name: "category", label: "Category", type: "select", options: ["WEB", "MOBILE", "API", "ML", "OTHER"] },
        { name: "live_url", label: "Live project URL", type: "url" }, { name: "github_url", label: "Source code URL", type: "url" },
        { name: "tech_stack_ids", label: "Skill IDs (comma-separated)" }, { name: "is_featured", label: "Featured", type: "checkbox" },
        { name: "cover_image", label: "Cover image", type: "file" },
    ],
    skills: [
        { name: "name", label: "Skill", required: true },
        { name: "category", label: "Category", type: "select", options: ["FRONTEND", "BACKEND", "DATABASE", "DEVOPS", "TOOLS", "SOFT_SKILL"] },
        { name: "proficiency", label: "Proficiency (1–100)", type: "number" },
        { name: "icon", label: "Icon name" }, { name: "is_featured", label: "Featured", type: "checkbox" },
    ],
    experience: [
        { name: "company", label: "Company", required: true }, { name: "role", label: "Role", required: true },
        { name: "employment_type", label: "Employment type", type: "select", options: ["FULL_TIME", "PART_TIME", "INTERNSHIP", "FREELANCE", "CONTRACT"] },
        { name: "location", label: "Location" }, { name: "start_date", label: "Start date", type: "date", required: true },
        { name: "end_date", label: "End date", type: "date" }, { name: "is_current", label: "Current role", type: "checkbox" },
        { name: "description", label: "Description", type: "textarea" }, { name: "company_url", label: "Company website", type: "url" },
    ],
    education: [
        { name: "institution", label: "Institution", required: true }, { name: "degree", label: "Degree", required: true },
        { name: "field_of_study", label: "Field of study" }, { name: "start_year", label: "Start year", type: "number", required: true },
        { name: "end_year", label: "End year", type: "number" }, { name: "grade", label: "Grade" },
        { name: "description", label: "Description", type: "textarea" },
    ],
    categories: [{ name: "name", label: "Category name", required: true }, { name: "description", label: "Description", type: "textarea" }],
    tags: [{ name: "name", label: "Tag name", required: true }],
    profile: [
        { name: "full_name", label: "Full name" }, { name: "headline", label: "Professional headline" },
        { name: "bio", label: "Biography", type: "textarea" }, { name: "email", label: "Public email", type: "email" },
        { name: "phone", label: "Phone" }, { name: "location", label: "Location" },
        { name: "years_of_experience", label: "Years of experience", type: "number" },
        { name: "github_url", label: "GitHub URL", type: "url" }, { name: "linkedin_url", label: "LinkedIn URL", type: "url" },
        { name: "x_url", label: "X URL", type: "url" }, { name: "website_url", label: "Website URL", type: "url" },
        { name: "is_available_for_hire", label: "Available for hire", type: "checkbox" },
        { name: "avatar", label: "Profile image", type: "file" }, { name: "resume", label: "Résumé (PDF)", type: "file" },
    ],
};

const menu: { kind?: Kind; label: string; icon: typeof LayoutDashboard; path: string }[] = [
    { label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
    { kind: "posts", label: "Posts", icon: FilePlus2, path: "/dashboard/posts" },
    { kind: "projects", label: "Projects", icon: Settings2, path: "/dashboard/projects" },
    { kind: "skills", label: "Skills", icon: Settings2, path: "/dashboard/skills" },
    { kind: "experience", label: "Experience", icon: Settings2, path: "/dashboard/experience" },
    { kind: "education", label: "Education", icon: Settings2, path: "/dashboard/education" },
    { kind: "categories", label: "Categories", icon: Settings2, path: "/dashboard/categories" },
    { kind: "tags", label: "Tags", icon: Settings2, path: "/dashboard/tags" },
    { kind: "comments", label: "Comments", icon: MessageSquare, path: "/dashboard/comments" },
    { kind: "messages", label: "Messages", icon: MessageSquare, path: "/dashboard/messages" },
    { kind: "profile", label: "Profile", icon: Settings2, path: "/dashboard/profile" },
];

function currentKind(path: string): Kind | null {
    if (path.startsWith("/dashboard/posts")) return "posts";
    const item = menu.find((entry) => entry.kind && entry.path === path);
    return item?.kind ?? null;
}

function rowTitle(row: Row): string {
    return String(row.title ?? row.name ?? row.role ?? row.company ?? row.subject ?? row.full_name ?? `Record ${row.id ?? ""}`);
}

export function OwnerDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const kind = currentKind(location.pathname);
    const isEditor = kind === "posts" && (location.pathname.endsWith("/new") || location.pathname.endsWith("/edit"));
    const [editing, setEditing] = useState<Row | null>(null);
    const [deleting, setDeleting] = useState<Row | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [postSearch, setPostSearch] = useState("");
    const [postStatus, setPostStatus] = useState("all");
    const title = isEditor ? (editing ? "Edit post" : "Write a post") : kind ? managerLabels[kind] : "Overview";
    const stats = useQuery({ queryKey: ["dashboard-stats"], queryFn: async () => (await api.get<DashboardStats>("/dashboard/stats/")).data, enabled: !kind });
    const resource = useQuery({
        queryKey: ["manage", kind, currentPage, postSearch, postStatus],
        queryFn: async () => {
            const response = await api.get<Row[] | Paginated<Row>>(`/${kind === "experience" ? "experiences" : kind === "messages" ? "contact" : kind}/`, {
                params: kind === "posts" ? { status: postStatus, search: postSearch, page: currentPage } : { page: currentPage },
            });
            return response.data;
        },
        enabled: Boolean(kind) && kind !== "profile",
    });
    const profile = useQuery({
        queryKey: ["profile"],
        queryFn: async () => (await api.get<Row>("/profile/")).data,
        enabled: kind === "profile",
    });
    const rows = useMemo(() => {
        const value = resource.data;
        return value ? (Array.isArray(value) ? value : value.results) : [];
    }, [resource.data]);
    const statsCards = stats.data ? [
        ["Published posts", stats.data.published_posts], ["Drafts", stats.data.draft_posts],
        ["Projects", stats.data.total_projects], ["Skills", stats.data.total_skills],
        ["Pending comments", stats.data.pending_comments], ["Unread messages", stats.data.unread_messages],
        ["Appreciations", stats.data.total_likes], ["Views", stats.data.total_views],
    ] : [];

    const updateRow = useMutation({
        mutationFn: async ({ path, method, data }: { path: string; method: "patch" | "delete"; data?: unknown }) => {
            if (method === "delete") return api.delete(path);
            return api.patch(path, data);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["manage"] });
            void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            void queryClient.invalidateQueries({ queryKey: ["posts"] });
            toast.success("Saved.");
            setDeleting(null);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
    });
    const pendingMessages = stats.data?.unread_messages;

    function apiPath(row: Row): string {
        const key = (kind === "posts" || kind === "projects") && row.slug ? `/${row.slug}` : `/${row.id}`;
        return `/${kind === "experience" ? "experiences" : kind === "messages" ? "contact" : kind}${kind === "profile" ? "/" : `${key}/`}`;
    }
    function toggleRead(row: Row) {
        const current = row.is_read;
        updateRow.mutate({ path: apiPath(row), method: "patch", data: { is_read: !current } });
    }
    function toggleApproved(row: Row) {
        updateRow.mutate({ path: apiPath(row), method: "patch", data: { is_approved: !row.is_approved } });
    }
    function beginEdit(row: Row) {
        setEditing(row);
        if (kind === "posts") navigate(`/dashboard/posts/${row.slug}/edit`);
    }
    function beginCreate() {
        setEditing(null);
        if (kind === "posts") navigate("/dashboard/posts/new");
    }
    function cancelEditor() {
        setEditing(null);
        navigate("/dashboard/posts");
    }

    return <div className="dashboard-layout">
        <Helmet><title>{title} · Owner dashboard</title></Helmet>
        <aside className="dashboard-sidebar">
            <Link to="/dashboard" className="dashboard-logo"><span className="brand-mark">d.</span><span>Owner studio<small>{user?.username}</small></span></Link>
            <nav aria-label="Owner dashboard">
                {menu.map(({ path, label, icon: Icon }) => <Link className={location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(`${path}/`)) ? "is-active" : ""} key={path} to={path}><Icon size={17} /><span>{label}</span>{label === "Messages" && pendingMessages ? <b className="inbox-badge">{pendingMessages}</b> : null}</Link>)}
            </nav>
            <Link className="dashboard-back" to="/"><ArrowLeft size={16} /> View public site</Link>
            <button className="dashboard-signout" type="button" onClick={() => void logout().then(() => navigate("/"))}><LogOut size={16} /> Sign out</button>
        </aside>
        <section className="dashboard-main">
            <header className="dashboard-topbar"><div><p className="eyebrow">Owner dashboard</p><h1>{title}</h1></div>{kind === "posts" && !isEditor && <button className="button button-dark" type="button" onClick={beginCreate}><Plus size={16} /> New post</button>}</header>
            {isEditor && <PostEditor post={editing} onCancel={cancelEditor} onDone={() => { cancelEditor(); void queryClient.invalidateQueries({ queryKey: ["manage", "posts"] }); }} />}
            {!kind && <Overview stats={stats.data} loading={stats.isLoading} error={stats.error} cards={statsCards} />}
            {kind === "profile" && <ProfileManager profile={profile.data} loading={profile.isLoading} error={profile.error} />}
            {kind && kind !== "profile" && !isEditor && <section className="manager-panel">
                {resource.isLoading && <LoadingState label={`Loading ${managerLabels[kind].toLowerCase()}`} />}
                {resource.isError && <div className="field-error" role="alert">{getErrorMessage(resource.error)} <button type="button" onClick={() => void resource.refetch()}>Retry</button></div>}
                {kind !== "comments" && kind !== "messages" && kind !== "posts" && <button className="button button-dark manager-add" type="button" onClick={() => setEditing({})}><Plus size={15} /> Add {managerLabels[kind].toLowerCase().replace(/s$/, "")}</button>}
                {editing && kind !== "posts" && <GenericEditor kind={kind} row={editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); void queryClient.invalidateQueries({ queryKey: ["manage", kind] }); }} />}
                {kind === "posts" && <><div className="manager-filters"><label>Search posts<input type="search" value={postSearch} onChange={(event) => { setPostSearch(event.target.value); setCurrentPage(1); }} placeholder="Title or article text" /></label><label>Status<select value={postStatus} onChange={(event) => { setPostStatus(event.target.value); setCurrentPage(1); }}><option value="all">All posts</option><option value="DRAFT">Drafts</option><option value="PUBLISHED">Published</option></select></label></div><PostTable rows={rows} onEdit={beginEdit} onDelete={setDeleting} onToggle={(row) => updateRow.mutate({ path: apiPath(row), method: "patch", data: { status: row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" } })} /></>}
                {kind === "comments" && <CommentsTable rows={rows} onApprove={toggleApproved} onDelete={setDeleting} onEdit={setEditing} />}
                {kind === "messages" && <MessagesTable rows={rows} onToggleRead={toggleRead} onDelete={setDeleting} />}
                {kind !== "posts" && kind !== "comments" && kind !== "messages" && <GenericTable rows={rows} onEdit={beginEdit} onDelete={setDeleting} />}
                {!rows.length && !resource.isLoading && !resource.isError && <EmptyState title={`No ${managerLabels[kind].toLowerCase()} yet.`} detail="Add your own information when you’re ready." />}
                {resource.data && !Array.isArray(resource.data) && <div className="pagination manager-pagination"><button className="button button-outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((value) => value - 1)} type="button">Previous</button><span>Page {currentPage}</span><button className="button button-outline" disabled={!resource.data.next} onClick={() => setCurrentPage((value) => value + 1)} type="button">Next</button></div>}
            </section>}
        </section>
        {deleting && <div className="modal-backdrop" role="presentation"><div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-heading"><p className="eyebrow">This cannot be undone</p><h2 id="delete-heading">Delete {rowTitle(deleting)}?</h2><p>This will permanently remove this record.</p><div className="modal-actions"><button className="button button-outline" type="button" onClick={() => setDeleting(null)}>Cancel</button><button className="button button-danger" type="button" disabled={updateRow.isPending} onClick={() => updateRow.mutate({ path: apiPath(deleting), method: "delete" })}><Trash2 size={15} /> Delete</button></div></div></div>}
    </div>;
}

function Overview({ stats, loading, error, cards }: { stats?: DashboardStats; loading: boolean; error: unknown; cards: (string | number)[][] }) {
    if (loading) return <LoadingState label="Loading dashboard metrics" />;
    if (error) return <p className="field-error" role="alert">{getErrorMessage(error)}</p>;
    return <div className="overview-content">
        <div className="stat-grid">{cards.map(([label, value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
        <div className="dashboard-columns"><section className="dashboard-box"><h2>Most-read posts</h2>{stats?.top_posts.length ? stats.top_posts.map((post, index) => <div className="top-post-row" key={post.slug}><span>0{index + 1}</span><Link to={`/blog/${post.slug}`}>{post.title}</Link><small>{post.views} views · {post.likes} likes</small></div>) : <p className="muted">Publish your first original article to see it here.</p>}</section>
            <section className="dashboard-box"><h2>Recent comments</h2>{stats?.recent_comments.length ? stats.recent_comments.map((comment) => <div className="recent-comment" key={comment.id}><strong>{comment.name}</strong><small>on {comment.post}</small><p>{comment.content}</p><span className={`badge ${comment.is_approved ? "badge-success" : ""}`}>{comment.is_approved ? "Approved" : "Pending"}</span></div>) : <p className="muted">No comments to review.</p>}</section>
        </div>
        <section className="dashboard-box month-chart"><h2>Published posts · last six months</h2><div className="chart-bars">{stats?.posts_per_month.map((month) => <div key={month.month}><span className="chart-value">{month.count}</span><span className="chart-bar" style={{ height: `${Math.max(6, Math.min(100, month.count * 20))}%` }} /><small>{month.month.slice(5)}</small></div>)}</div></section>
    </div>;
}

function PostTable({ rows, onEdit, onDelete, onToggle }: { rows: Row[]; onEdit: (row: Row) => void; onDelete: (row: Row) => void; onToggle: (row: Row) => void }) {
    return <div className="table-wrap"><table><thead><tr><th>Title</th><th>Status</th><th>Views</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)}><td><strong>{String(row.title ?? "")}</strong></td><td><span className={`badge ${row.status === "PUBLISHED" ? "badge-success" : ""}`}>{String(row.status ?? "")}</span></td><td>{String(row.views_count ?? 0)}</td><td>{row.updated_at ? new Date(String(row.updated_at)).toLocaleDateString() : "—"}</td><td className="row-actions"><button aria-label="Edit post" onClick={() => onEdit(row)} type="button"><Pencil size={15} /></button><button onClick={() => onToggle(row)} type="button">{row.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button><button aria-label="Delete post" onClick={() => onDelete(row)} type="button"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>;
}

function GenericTable({ rows, onEdit, onDelete }: { rows: Row[]; onEdit: (row: Row) => void; onDelete: (row: Row) => void }) {
    return <div className="table-wrap"><table><thead><tr><th>Name</th><th>Details</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)}><td><strong>{rowTitle(row)}</strong></td><td>{String(row.category ?? row.summary ?? row.headline ?? row.institution ?? "")}</td><td className="row-actions"><button aria-label={`Edit ${rowTitle(row)}`} onClick={() => onEdit(row)} type="button"><Pencil size={15} /></button><button aria-label={`Delete ${rowTitle(row)}`} onClick={() => onDelete(row)} type="button"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>;
}

function CommentsTable({ rows, onApprove, onDelete }: { rows: Row[]; onApprove: (row: Row) => void; onDelete: (row: Row) => void; onEdit: (row: Row) => void }) {
    return <div className="table-wrap"><table><thead><tr><th>Comment</th><th>Post</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={String(row.id)}><td><strong>{String(row.name ?? "")}</strong><p>{String(row.content ?? "")}</p></td><td>{String((row.post as Row | undefined)?.title ?? row.post ?? "")}</td><td><span className="badge">{row.is_approved ? "Approved" : "Pending"}</span></td><td className="row-actions"><button type="button" onClick={() => onApprove(row)}><Check size={15} /> {row.is_approved ? "Hide" : "Approve"}</button><button aria-label="Delete comment" type="button" onClick={() => onDelete(row)}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>;
}

function MessagesTable({ rows, onToggleRead, onDelete }: { rows: Row[]; onToggleRead: (row: Row) => void; onDelete: (row: Row) => void }) {
    return <div className="message-list">{rows.map((row) => <article className={`message-card ${row.is_read ? "" : "is-unread"}`} key={String(row.id)}><div className="message-head"><div><span className="badge">{row.is_read ? "Read" : "Unread"}</span><h3>{String(row.subject ?? "")}</h3><p>{String(row.name ?? "")} · <a href={`mailto:${String(row.email ?? "")}`}>{String(row.email ?? "")}</a></p></div><time>{row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : ""}</time></div><p>{String(row.message ?? "")}</p><div className="row-actions"><button type="button" onClick={() => onToggleRead(row)}>{row.is_read ? "Mark unread" : "Mark read"}</button><button type="button" onClick={() => onDelete(row)}><Trash2 size={15} /> Delete</button></div></article>)}</div>;
}

function GenericEditor({ kind, row, onCancel, onDone }: { kind: Kind; row: Row; onCancel: () => void; onDone: () => void }) {
    const queryClient = useQueryClient();
    const fields = managerFields[kind as Exclude<Kind, "comments" | "messages">] ?? EMPTY_FIELDS;
    const [files, setFiles] = useState<Record<string, File>>({});
    const [preview, setPreview] = useState("");
    const [formError, setFormError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const isProfile = kind === "profile";
    const mutation = useMutation({
        mutationFn: async (values: Record<string, unknown>) => {
            const formData = new FormData();
            const fileFields = fields.filter((field) => field.type === "file").map((field) => field.name);
            for (const [key, value] of Object.entries(values)) {
                if (fileFields.includes(key)) continue;
                if (key === "tag_ids" || key === "tech_stack_ids") {
                    const ids = String(value).split(",").map((item) => Number(item.trim())).filter(Boolean);
                    for (const id of ids) formData.append(key, String(id));
                } else if (value !== undefined && value !== null && value !== "") formData.append(key, String(value));
            }
            for (const [key, file] of Object.entries(files)) formData.append(key, file);
            const hasListFields = ["tag_ids", "tech_stack_ids"].some((key) => key in values);
            const body = Object.keys(files).length || hasListFields
                ? formData
                : Object.fromEntries(Object.entries(values).filter(([key]) => !fileFields.includes(key)));
            const singular = kind === "experience" ? "experiences" : kind;
            const base = `/${singular}/`;
            const identifier = (kind === "posts" || kind === "projects") ? row.slug ?? row.id : row.id;
            const path = isProfile ? "/profile/" : identifier ? `${base}${identifier}/` : base;
            return identifier || isProfile ? api.patch(path, body) : api.post(base, body);
        },
        onSuccess: () => {
            toast.success("Changes saved.");
            void queryClient.invalidateQueries({ queryKey: ["manage", kind] });
            void queryClient.invalidateQueries({ queryKey: ["profile"] });
            onDone();
        },
        onError: (error) => { setFormError(getErrorMessage(error)); setFieldErrors(getFieldErrors(error)); },
    });

    useEffect(() => {
        if (!files.cover_image && !files.avatar) {
            setPreview("");
            return;
        }
        const file = files.cover_image ?? files.avatar;
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [files]);

    const initialValues = useMemo(() => {
        const value: Record<string, unknown> = {};
        for (const field of fields) {
            const rowValue = row[field.name];
            if (field.name === "tag_ids" || field.name === "tech_stack_ids") value[field.name] = "";
            else value[field.name] = rowValue ?? (field.type === "checkbox" ? false : "");
        }
        return value;
    }, [row, fields]);
    const [values, setValues] = useState<Record<string, unknown>>(initialValues);
    const previewImage = preview || String(row.cover_image ?? row.avatar ?? "");

    return <form className="editor-form" onSubmit={(event) => {
        event.preventDefault();
        setFormError("");
        setFieldErrors({});
        if (kind === "projects" && !values.live_url && !values.github_url) { setFormError("Provide a live project URL or source code URL."); return; }
        mutation.mutate(values);
    }}>
        <div className="editor-header"><div><p className="eyebrow">{row.id ? "Update a record" : "Add to your portfolio"}</p><h2>{row.id ? `Edit ${managerLabels[kind].toLowerCase().replace(/s$/, "")}` : `New ${managerLabels[kind].toLowerCase().replace(/s$/, "")}`}</h2></div><button className="icon-button" type="button" aria-label="Close editor" onClick={onCancel}>×</button></div>
        {previewImage && <img className="upload-preview" src={previewImage} alt="Selected upload preview" />}
        <div className="editor-fields">{fields.map((field) => <label className={field.type === "textarea" ? "field-wide" : ""} key={field.name}>{field.label}
            {field.type === "textarea" ? <textarea rows={5} required={field.required} value={String(values[field.name] ?? "")} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })} />
                : field.type === "checkbox" ? <input type="checkbox" checked={Boolean(values[field.name])} onChange={(event) => setValues({ ...values, [field.name]: event.target.checked })} />
                    : field.type === "select" ? <select required={field.required} value={String(values[field.name] ?? "")} onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}><option value="">Choose one</option>{field.options?.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>
                        : field.type === "file" ? <input type="file" accept={field.name === "resume" ? ".pdf,application/pdf" : ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"} onChange={(event) => { const file = event.target.files?.[0]; if (file) setFiles({ ...files, [field.name]: file }); }} />
                            : <input type={field.type ?? "text"} required={field.required} value={String(values[field.name] ?? "")} onChange={(event) => setValues({ ...values, [field.name]: field.type === "number" ? Number(event.target.value) : event.target.value })} />}
            {fieldErrors[field.name] && <span className="field-error" role="alert">{fieldErrors[field.name]}</span>}
        </label>)}</div>
        {formError && <p className="field-error" role="alert">{formError}</p>}
        <div className="modal-actions"><button className="button button-outline" type="button" onClick={onCancel}>Cancel</button><button className="button button-dark" disabled={mutation.isPending} type="submit">{mutation.isPending ? "Saving…" : "Save changes"} <Check size={15} /></button></div>
    </form>;
}

function PostEditor({ post, onCancel, onDone }: { post: Row | null; onCancel: () => void; onDone: () => void }) {
    const queryClient = useQueryClient();
    const categories = useCategories({ page_size: 100 });
    const tags = useTags({ page_size: 100 });
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [cover, setCover] = useState<File | null>(null);
    const [preview, setPreview] = useState("");
    const [values, setValues] = useState<Record<string, string | boolean>>({
        title: String(post?.title ?? ""),
        excerpt: String(post?.excerpt ?? ""),
        content: String(post?.content ?? ""),
        status: String(post?.status ?? "DRAFT"),
        category_id: String(post?.category_id ?? (post?.category as Row | undefined)?.id ?? ""),
        tag_ids: Array.isArray(post?.tags) ? (post.tags as Row[]).map((tag) => tag.id).join(",") : "",
        is_featured: Boolean(post?.is_featured ?? false),
    });
    const mutation = useMutation({
        mutationFn: async () => {
            const data = new FormData();
            for (const [key, value] of Object.entries(values)) {
                if (key === "tag_ids") {
                    for (const id of value.toString().split(",").map((item) => item.trim()).filter(Boolean)) data.append(key, id);
                } else data.append(key, String(value));
            }
            if (cover) data.append("cover_image", cover);
            const path = post?.slug ? `/posts/${post.slug}/` : "/posts/";
            return post?.slug ? api.patch(path, data) : api.post(path, data);
        },
        onSuccess: () => { toast.success("Post saved."); void queryClient.invalidateQueries({ queryKey: ["manage", "posts"] }); void queryClient.invalidateQueries({ queryKey: ["posts"] }); onDone(); },
        onError: (saveError) => { setError(getErrorMessage(saveError)); setFieldErrors(getFieldErrors(saveError)); },
    });
    useEffect(() => {
        if (!cover) { setPreview(""); return; }
        const url = URL.createObjectURL(cover);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [cover]);
    return <form className="editor-form post-editor" onSubmit={(event) => { event.preventDefault(); setError(""); setFieldErrors({}); mutation.mutate(); }}>
        <div className="editor-header"><div><p className="eyebrow">{post ? "A work in progress" : "Start writing"}</p><h2>{post ? "Edit journal post" : "New journal post"}</h2></div><button className="button button-outline" type="button" onClick={onCancel}>Cancel</button></div>
        {Boolean(preview || post?.cover_image) && <img className="upload-preview" src={preview || String(post?.cover_image)} alt="Cover preview" />}
        <div className="editor-fields">
            <label className="field-wide">Title<input required minLength={5} value={String(values.title ?? "")} onChange={(event) => setValues({ ...values, title: event.target.value })} />{fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}</label>
            <label className="field-wide">Excerpt<textarea maxLength={300} rows={2} value={String(values.excerpt ?? "")} onChange={(event) => setValues({ ...values, excerpt: event.target.value })} />{fieldErrors.excerpt && <span className="field-error">{fieldErrors.excerpt}</span>}</label>
            <label className="field-wide">Article content (Markdown)<textarea required rows={16} value={String(values.content ?? "")} onChange={(event) => setValues({ ...values, content: event.target.value })} /><small>Published articles need at least 100 characters. Markdown is supported; raw HTML is not.</small>{fieldErrors.content && <span className="field-error">{fieldErrors.content}</span>}</label>
            <label>Category<select value={String(values.category_id ?? "")} onChange={(event) => setValues({ ...values, category_id: event.target.value })}><option value="">Choose a category</option>{categories.data?.results.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select>{fieldErrors.category_id && <span className="field-error">{fieldErrors.category_id}</span>}</label>
            <label>Tags<select multiple value={String(values.tag_ids ?? "").split(",").filter(Boolean)} onChange={(event) => setValues({ ...values, tag_ids: Array.from(event.target.selectedOptions, (option) => option.value).join(",") })}>{tags.data?.results.map((tag) => <option value={tag.id} key={tag.id}>{tag.name}</option>)}</select><small>Hold Ctrl or Command to select more than one.</small></label>
            <label>Status<select value={String(values.status ?? "DRAFT")} onChange={(event) => setValues({ ...values, status: event.target.value })}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>
            <label>Cover image<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => setCover(event.target.files?.[0] ?? null)} /></label>
            <label className="check-field"><input type="checkbox" checked={Boolean(values.is_featured)} onChange={(event) => setValues({ ...values, is_featured: event.target.checked })} /> Featured post</label>
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Save post"} <Send size={15} /></button>
    </form>;
}

function ProfileManager({ profile, loading, error }: { profile?: Row; loading: boolean; error: unknown }) {
    const queryClient = useQueryClient();
    const [passwordMessage, setPasswordMessage] = useState("");
    const passwordMutation = useMutation({
        mutationFn: async (values: { old_password: string; new_password: string }) => api.post("/auth/change-password/", values),
        onSuccess: () => { setPasswordMessage("Password updated."); toast.success("Password updated."); },
        onError: (saveError) => setPasswordMessage(getErrorMessage(saveError)),
    });
    if (loading) return <LoadingState label="Loading profile" />;
    if (error) return <p className="field-error" role="alert">{getErrorMessage(error)}</p>;
    return <div className="profile-managers">
        <GenericEditor kind="profile" row={profile ?? {}} onCancel={() => {}} onDone={() => void queryClient.invalidateQueries({ queryKey: ["profile"] })} />
        <form className="editor-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const values = new FormData(form); passwordMutation.mutate({ old_password: String(values.get("old_password")), new_password: String(values.get("new_password")) }); }}>
            <h2>Change password</h2><div className="editor-fields"><label>Current password<input required name="old_password" type="password" autoComplete="current-password" /></label><label>New password<input required name="new_password" type="password" minLength={8} autoComplete="new-password" /></label></div><button className="button button-dark" type="submit" disabled={passwordMutation.isPending}>Update password <Check size={15} /></button>{passwordMessage && <p role="status">{passwordMessage}</p>}
        </form>
    </div>;
}
