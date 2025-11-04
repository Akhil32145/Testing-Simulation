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

fixture `Flaky Test Suite`
    .page `https://example.com`;

testNames.forEach(name => {
    test(name, async t => {
        const shouldFail = Math.random() > 0.5; // ~50% chance to fail
        await t.expect(!shouldFail).ok(`Random failure for ${name}`);
    });
});
