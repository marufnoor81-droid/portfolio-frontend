import { useQuery } from "@tanstack/react-query";
import api from "./axios";
import type {
    Category,
    Comment,
    DashboardStats,
    Education,
    Experience,
    Paginated,
    Post,
    Profile,
    Project,
    Skill,
    Tag,
} from "./types";

type QueryParams = Record<string, string | number | undefined>;

function useResource<T>(key: string, path: string, params?: QueryParams) {
    return useQuery<T>({
        queryKey: [key, params ?? {}],
        queryFn: async () => (await api.get<T>(path, { params })).data,
    });
}

export const useProfile = () => useResource<Profile>("profile", "/profile/");
export const useSkills = (params?: QueryParams) => useResource<Paginated<Skill>>("skills", "/skills/", params);
export const useExperience = (params?: QueryParams) => useResource<Paginated<Experience>>("experience", "/experiences/", params);
export const useEducation = (params?: QueryParams) => useResource<Paginated<Education>>("education", "/education/", params);
export const useProjects = (params?: QueryParams) => useResource<Paginated<Project>>("projects", "/projects/", params);
export const useProject = (slug: string) => useQuery<Project>({ queryKey: ["project", slug], queryFn: async () => (await api.get<Project>(`/projects/${slug}/`)).data });
export const useCategories = (params?: QueryParams) => useResource<Paginated<Category>>("categories", "/categories/", params);
export const useTags = (params?: QueryParams) => useResource<Paginated<Tag>>("tags", "/tags/", params);
export const usePosts = (params?: QueryParams) => useResource<Paginated<Post>>("posts", "/posts/", params);
export const usePost = (slug: string) => useQuery<Post>({ queryKey: ["post", slug], queryFn: async () => (await api.get<Post>(`/posts/${slug}/`)).data });
export const useComments = (slug: string) => useResource<Paginated<Comment> | Comment[]>("comments", `/posts/${slug}/comments/`);
export const useDashboardStats = () => useResource<DashboardStats>("dashboard-stats", "/dashboard/stats/");

export function pageResults<T>(data: Paginated<T> | T[] | undefined): T[] {
    if (!data) return [];
    return Array.isArray(data) ? data : data.results;
}

export function resultCount<T>(data: Paginated<T> | T[] | undefined): number {
    if (!data) return 0;
    return Array.isArray(data) ? data.length : data.count;
}
