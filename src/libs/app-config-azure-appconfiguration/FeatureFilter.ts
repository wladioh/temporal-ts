import { FeatureFlagValue, UserFeature } from "@app-config";
type TargetFilter = {
	Audience: {
		Groups: Array<{ Name: string; RolloutPercentage: number }>;
		Users: Array<string>;
		DefaultRolloutPercentage: number;
	};
};

type WindowFilter = {
	End: string;
	Start: string;
};

enum Type {
	Target = "Microsoft.Targeting",
	TimeWindow = "Microsoft.TimeWindow",
	Percentage = "Microsoft.Percentage",
}
type ClientFilter = {
	name: string;
	parameters?: Record<string, unknown>;
};
export class FeatureFilter {
	private static CalcPercentagem(rolloutPercentage: number) {
		return Math.floor(Math.random() * 100) <= rolloutPercentage;
	}
	private static CheckPercent(clientFilter: ClientFilter): boolean {
		const rolloutPercentage = <number>clientFilter.parameters?.Value || 0;
		return this.CalcPercentagem(rolloutPercentage);
	}
	private static CheckClientTarget(
		clientFilter: ClientFilter,
		user?: Partial<UserFeature>
	) {
		const target: TargetFilter = <any>clientFilter.parameters;
		if (user) {
			if (target.Audience.Users.includes(user.userId ?? "")) return true;
			const group = target.Audience.Groups.find((it) =>
				user.groups?.includes(it.Name)
			);
			if (group) {
				return this.CalcPercentagem(group.RolloutPercentage);
			}
		}
		return this.CalcPercentagem(target.Audience.DefaultRolloutPercentage);
	}

	private static CheckTimeWindow(clientFilter: ClientFilter) {
		// Changes the start time
		const filter: WindowFilter = <any>clientFilter.parameters;
		const startDate = new Date(filter.Start);
		const endDate = new Date(filter.End);
		const now = new Date();
		return startDate < now && now < endDate;
	}

	static IsEnabled(
		feature?: FeatureFlagValue,
		user?: Partial<UserFeature>
	): boolean {
		if (!feature || !feature.enabled) return false;
		for (const clientFilter of feature.conditions.clientFilters) {
			clientFilter.parameters = clientFilter.parameters ?? {};
			switch (clientFilter.name) {
				// Tweak the client filters of the feature flag
				case Type.Target:
					return this.CheckClientTarget(clientFilter, user);
				case Type.TimeWindow:
					return this.CheckTimeWindow(clientFilter);
				case Type.Percentage:
					// Changes the percentage value from 50 to 75 - to enable the feature flag for 75% of requests
					return this.CheckPercent(clientFilter);
				default:
					// Change the filter name for all other client filters
					// clientFilter.name = "FilterY";
					return false;
			}
		}
		return feature.enabled;
	}
}
