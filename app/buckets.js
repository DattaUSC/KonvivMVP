var firebase = require("firebase");

// const ESTIMATION_PERIOD = 180;
const MONTH_PERIOD = 31;


//Maps transaction name to the bucket the user most recently selected for it
var mostRecentBucket = {}

var userdefinedBuckets = {}

var predefinedBuckets = {
    'Supermarkets and Groceries': 'Groceries',
    'Food and Drink': 'Eating Out',
    'Travel': 'Transportation',
    'Automotive': 'Transportation',
    'Transportation': 'Transportation',
    'Recreation': 'Entertainment',
    'Personal': 'Entertainment',
    'Shops': 'Shopping',
    'Utilities': 'Bills',
    'Subscription': 'Subscriptions'
};

exports.selectBucket = function selectBucket (transaction) {
    // console.log('New Selection:');
    var bucket = 'General Spending';
    if (transaction.amount < 0) {
        return 'Income';
    }
    if (userdefinedBuckets[transaction.name]) {
        return userdefinedBuckets[transaction.name];
    }
    if (transaction.category ==  null) {
        return 'General Spending';
    }
    for (i = 0; i < transaction.category.length; i++) {
        var category = transaction.category[i] ;
        // console.log(category);
        if (predefinedBuckets[category]) {
            bucket = predefinedBuckets[category];
        }
    }
    return bucket
}

exports.estimateSize = function estimateSize (transactions, userId, estimationPeriod) {
    var bucketAmounts = {
        'Groceries': 0,
        'Eating Out': 0,
        'Transportation': 0,
        'Entertainment': 0,
        'Shopping': 0,
        'Bills': 0,
        'Subscriptions': 0,
        'Income': 0
    };
    var allBucketAmounts = 0;

    firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
        for (var bucket in bucketAmounts) {
            console.log('running bucket estimations...');

            var totalBucketAmount = 0;
            for (var key in snapshot.val()[bucket]) {
                if (snapshot.val()[key]) {
                    var amount = snapshot.val()[key]['amount'];
                    if (bucket === "Income") {
                        amount = -amount;
                    }
                    totalBucketAmount += amount;
                }
            }

            var monthlyBucketAmount = totalBucketAmount/estimationPeriod * MONTH_PERIOD;

            bucketAmounts[bucket] = monthlyBucketAmount;
            console.log(bucket + ': ' + bucketAmounts[bucket]);
            allBucketAmounts += monthlyBucketAmount;
        }
    });

    bucketAmounts['General Spending '] = Math.max(bucketAmounts['Income'] - allBucketAmounts, 0);

    // console.log('running bucket estimations...');
    // for (var key in bucketAmounts) {
    //     console.log(key + ': ' + bucketAmounts[key]);
    // }
    return bucketAmounts
}

// If the bucket the user is moving this transaction to matches the last
// bucket the user moved a transaction with this name to (i.e., the user
// moves transactions with the same name to the same bucket twice in a row),
// automatically store that bucket in userdefinedBuckets to categorize all
// transactions sharing this name to that bucket in the future.
function reclassification (transaction, oldBucket, newBucket) {
    if (oldBucket != newBuckets) {
        if (mostRecentBucket[transaction.name] == newBucket) {
            userdefinedBuckets[transaction.name] = newBucket;
        } else {
            mostRecentBucket[transaction.name] = newBucket;
        }
    }
};

exports.moveTransaction = function moveTransaction (transaction, userId, oldBucket, newBucket) {
    reclassification(transaction, oldBucket, newBucket);
    var newPostKey = transaction.transaction_id;
    var postData = {}

    postData[newPostKey] = transaction;

    //add transaction to new bucket
    firebase.database().ref('users/' + userId + "/" + newBucket).update(postData);

    //delete transaction from old bucket
    firebase.database().ref('users/' + userId + "/" + oldBucket).remove(postData);
}

// exports.moveMoney = function moveMoney () {
//     //subtract from this bucket
//     //add to that bucket
// }

// exports.moneyRemaining = function moneyRemaining () {
//     //sum up transaction
//     //subtract from bucket total
// }

// exports.deleteBucket = function moveBucket () {
//
// }
//
// exports.newBucket = function moveBucket () {
//
// }
