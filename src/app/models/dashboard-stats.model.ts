export interface StatItem {
    label: string;
    count: number;
    icon: string;
    route: string;
    items?: { id: number; name: string }[];
}

export interface DashboardStatsResponse {
    stats: StatItem[];
}
