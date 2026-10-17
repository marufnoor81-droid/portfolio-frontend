import { AlertCircle, ArrowRight, LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function LoadingState({ label = "Loading content" }: { label?: string }) {
    return <div className="loading-state" role="status"><LoaderCircle className="spinner" size={22} /><span>{label}</span></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="state-card error-state" role="alert">
            <AlertCircle size={22} />
            <p>{message}</p>
            <button className="button button-outline" type="button" onClick={onRetry}>Try again <ArrowRight size={15} /></button>
        </div>
    );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
    return <div className="state-card empty-state"><span className="eyebrow">Nothing here yet</span><h3>{title}</h3>{detail && <p>{detail}</p>}</div>;
}

export function QueryState({ query, label }: { query: { isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown }; label?: string }) {
    if (query.isLoading) return <LoadingState label={label} />;
    if (query.isError) {
        const message = query.error instanceof Error ? query.error.message : "Could not load this content.";
        return <ErrorState message={message} onRetry={() => void query.refetch()} />;
    }
    return null;
}

export function Pagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
    if (pageCount < 2) return null;
    return (
        <nav className="pagination" aria-label="Pagination">
            <button type="button" className="button button-outline" onClick={() => onPage(page - 1)} disabled={page <= 1}>Previous</button>
            <span>Page {page} of {pageCount}</span>
            <button type="button" className="button button-outline" onClick={() => onPage(page + 1)} disabled={page >= pageCount}>Next</button>
        </nav>
    );
}

export function SectionHeading({ eyebrow, title, accent, link, to }: { eyebrow: string; title: string; accent?: string; link?: string; to?: string }) {
    return (
        <div className="section-heading">
            <div><p className="eyebrow">{eyebrow}</p><h2>{title} {accent && <span className="serif-accent">{accent}</span>}</h2></div>
            {link && to && <Link className="text-link" to={to}>{link} <ArrowRight size={15} /></Link>}
        </div>
    );
}
