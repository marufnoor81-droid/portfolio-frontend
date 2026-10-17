export interface Paginated<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface Profile {
    id: number;
    full_name: string;
    headline: string;
    bio: string;
    email: string;
    phone: string;
    location: string;
    avatar: string | null;
    resume: string | null;
    github_url: string;
    linkedin_url: string;
    x_url: string;
    website_url: string;
    years_of_experience: number;
    is_available_for_hire: boolean;
}

export interface Skill {
    id: number;
    name: string;
    category: string;
    proficiency: number;
    icon: string;
    is_featured: boolean;
    display_order: number;
}

export interface Experience {
    id: number;
    company: string;
    role: string;
    employment_type: string;
    location: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    description: string;
    company_url: string;
}

export interface Education {
    id: number;
    institution: string;
    degree: string;
    field_of_study: string;
    start_year: number;
    end_year: number | null;
    grade: string;
    description: string;
}

export interface Project {
    id: number;
    title: string;
    slug: string;
    summary: string;
    description: string;
    cover_image: string | null;
    category: string;
    tech_stack: Skill[];
    live_url: string;
    github_url: string;
    is_featured: boolean;
    completed_date: string | null;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string;
    posts_count: number;
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
    posts_count: number;
}

export interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    cover_image: string | null;
    category: Category | null;
    tags: Tag[];
    status: "DRAFT" | "PUBLISHED";
    published_at: string | null;
    views_count: number;
    reading_time: number;
    is_featured: boolean;
    likes_count: number;
    comments_count: number;
    is_liked: boolean;
    related_posts: Pick<Post, "title" | "slug" | "excerpt" | "reading_time">[];
}

export interface Comment {
    id: number;
    post?: number;
    name: string;
    website: string;
    content: string;
    parent: number | null;
    is_approved: boolean;
    created_at: string;
    replies: Omit<Comment, "replies">[];
}

export interface ContactMessage {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export interface Owner {
    id: number;
    username: string;
    email: string;
}

export interface DashboardStats {
    total_posts: number;
    published_posts: number;
    draft_posts: number;
    total_projects: number;
    total_skills: number;
    total_comments: number;
    pending_comments: number;
    total_likes: number;
    total_views: number;
    unread_messages: number;
    top_posts: { title: string; slug: string; views: number; likes: number }[];
    recent_comments: { id: number; name: string; post: string; content: string; is_approved: boolean }[];
    posts_per_month: { month: string; count: number }[];
}
