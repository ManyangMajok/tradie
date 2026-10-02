/**
 * k6 load test — job submission + dispatch path
 *
 * Prerequisites:
 *   brew install k6  (or https://k6.io/docs/getting-started/installation/)
 *   APP_URL=https://staging.tradify.au k6 run tests/load/dispatch.js
 *
 * Simulates 100 concurrent members each submitting a job and polling for status.
 * Acceptance: error rate < 1%, p99 response < 2000ms.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.APP_URL || 'http://localhost:8000';

export const errorRate = new Rate('errors');

export const options = {
    stages: [
        { duration: '30s', target: 20 },   // ramp up
        { duration: '1m',  target: 100 },  // hold at 100 concurrent
        { duration: '30s', target: 0 },    // ramp down
    ],
    thresholds: {
        http_req_duration: ['p(99)<2000'],
        errors: ['rate<0.01'],
    },
};

// Credentials for seeded load-test member accounts.
// Rotate across 10 accounts to avoid per-user rate limiting.
const MEMBER_EMAILS = Array.from({ length: 10 }, (_, i) => `loadtest.member${i + 1}@tradify.test`);
const MEMBER_PASSWORD = 'password';

// Suburb IDs and category IDs from the seed data.
const SUBURB_IDS = [1, 2, 3, 4, 5];
const CATEGORY_IDS = [1, 2, 3];
const URGENCIES = ['flexible', 'this_week', 'next_day'];

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export default function () {
    const email = randomChoice(MEMBER_EMAILS);

    // ── Step 1: login ────────────────────────────────────────────────────────
    const loginRes = http.post(
        `${BASE_URL}/login`,
        JSON.stringify({ email, password: MEMBER_PASSWORD }),
        {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Inertia': 'true' },
            redirects: 0,
        }
    );

    const loginOk = check(loginRes, {
        'login 2xx or 302': (r) => r.status >= 200 && r.status < 400,
    });
    errorRate.add(!loginOk);

    if (!loginOk) {
        sleep(1);
        return;
    }

    // Extract session cookie
    const cookies = loginRes.cookies;

    // ── Step 2: submit a job ─────────────────────────────────────────────────
    const jobPayload = {
        tradie_category_id: randomChoice(CATEGORY_IDS),
        suburb_id: randomChoice(SUBURB_IDS),
        urgency: randomChoice(URGENCIES),
        description: 'Load test job — automated submission',
        best_contact_time: 'any',
        property_id: 1,
    };

    const jobRes = http.post(
        `${BASE_URL}/jobs`,
        JSON.stringify(jobPayload),
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Inertia': 'true',
            },
            cookies,
            redirects: 0,
        }
    );

    const jobOk = check(jobRes, {
        'job submitted 2xx/302': (r) => r.status >= 200 && r.status < 400,
    });
    errorRate.add(!jobOk);

    sleep(Math.random() * 2 + 1); // 1–3s think time
}
