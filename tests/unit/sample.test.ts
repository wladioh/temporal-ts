describe("Example - unit Test", () => {
	beforeEach(() => {
		jest.resetAllMocks();
		jest.restoreAllMocks();
	});

	describe("Exemples", () => {
		it("Should first exemple", async () => {
			expect(1).toBe(1);
		});
	});
});
