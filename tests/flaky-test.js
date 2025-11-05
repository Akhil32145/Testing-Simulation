import { Selector } from 'testcafe';

const testNames = [
    'LoginTest',
    'SignupTest',
    'SearchTest',
    'CheckoutTest',
    'ProfileUpdateTest',
    'LogoutTest',
    'AddToCartTest',
    'RemoveFromCartTest',
    'PaymentTest',
    'OrderHistoryTest',
    'FilterTest',
    'SortTest',
    'WishlistTest',
    'ReviewTest',
    'NotificationTest'
];

// Utility to make randomness more chaotic
function shouldFailRandomly(testName) {
    // Create a unique seed based on the test name
    const randomFactor = Math.random();

    // Weighted random behavior:
    // 30% of tests are very flaky (fail ~70–90% of the time)
    // 40% are moderately flaky (fail ~40–60%)
    // 30% are mostly stable (fail ~10–30%)
    if (randomFactor < 0.3) {
        return Math.random() < 0.85; // very flaky
    } else if (randomFactor < 0.7) {
        return Math.random() < 0.5; // medium flaky
    } else {
        return Math.random() < 0.2; // mostly stable
    }
}

fixture`Flaky Test Suite`
    .page`https://example.com`;

testNames.forEach(name => {
    test(name, async t => {
        const shouldFail = shouldFailRandomly(name);
        await t.expect(!shouldFail).ok(`⚠️ Random failure triggered for ${name}`);
    });
});

