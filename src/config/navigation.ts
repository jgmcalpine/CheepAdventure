export type NavItem = {
	label: string;
	href: string;
	icon?: string;
};

export const navigationItems: NavItem[] = [
	{
		label: 'Read',
		href: '/read',
	},
	{
		label: 'Write',
		href: '/write',
	},
]; 