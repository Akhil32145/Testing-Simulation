import { Selector } from 'testcafe';

fixture`Flaky Tests Demo`
    .page`https://example.com`;

test('Flaky Test 1', async t => {
    const randomFail = Math.random() < 0.5;
    await t.expect(true).ok();
    if (randomFail) await t.expect(false).ok('Random failure occurred!');
});

test('Flaky Test 2', async t => {
    const randomFail = Math.random() < 0.3;
    await t.expect(true).ok();
    if (randomFail) await t.expect(false).ok('Another random failure!');
});
