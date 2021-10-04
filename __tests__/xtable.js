
// const {describe, it} = require('jest'); 

describe('XTable', function() {
    const testData = require('./testDataSource.json');
    const {XTable} = require('../src')

    describe('length', function() {
        test('should not count the header field', function() {
            let table = new XTable(testData);
            expect(table.length).toBe(testData.length - 1);
        })
    })

    describe('selectFirst', function() {
        test('should select the first match', function() {
            let table = new XTable(testData);
            let entry = table.selectFirst(entry => {
                // console.log('entry: %o', entry);
                return entry.pid === 'PID1792'
            });
            expect(entry).not.toBe(undefined);
            expect(entry.rowIndex).toBe(32);
        })
    })

    describe('select', function() {
        test('should select a set of items', function() {
            let table = new XTable(testData);
            let entries = [...table.select(entry => {
                // console.log('entry: %o', entry);
                return entry.pid === 'PID1792'
            })];

            entries.forEach(entry => expect(entry.pid).toBe('PID1792'));
            expect(entries).toHaveLength(17);
        })

        test('should select a set of limited items', function() {
            let table = new XTable(testData);
            let entries = [...table.select({
                limit: 4,
                criteria: entry => {
                    // console.log('entry: %o', entry);
                    return entry.pid === 'PID1792'
                }
            })];

            entries.forEach(entry => expect(entry.pid).toBe('PID1792'));
            expect(entries).toHaveLength(4);
        })

        test('should select a set of within a range', function() {
            let table = new XTable(testData);
            let entries = [...table.select({
                from: 30,
                to: 57,
                criteria: entry => {
                    // console.log('entry: %o', entry);
                    return entry.productId === '85-BH'
                }
            })];

            entries.forEach(entry => expect(entry.pid).toMatch(/ACM100340|PID1701/));
            expect(entries).toHaveLength(5);
        })
    })

    describe('selectNow', function() {
        test('should select a set of items', function() {
            let table = new XTable(testData);
            let entries = table.selectNow(entry => {
                // console.log('entry: %o', entry);
                return entry.productId === '85-BH'
            });

            entries.forEach(entry => expect(entry.pid).toMatch(/ACM100340|PID1701/));
            expect(entries).toHaveLength(13);
        })
    })

    describe('sort', function() {
        test('should sort the dataset', function() {
            let data = [...testData];
            let table = new XTable(data);

            table.sort((a, b) => a.productId > b.productId);

            let entries = table.selectNow(entry => entry.productId.startsWith('85-BH'));
            // entries.forEach(entry => )
            console.log('%o', entries[0]);
            expect(entries).toHaveLength(13);
        })
    })

});
