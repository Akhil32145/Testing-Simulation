pipeline {
    agent any

    parameters {
        string(name: 'RETRY_COUNT', defaultValue: '2', description: 'Number of retries for failed tests')
    }

    environment {
        REPORT_DIR = 'reports'
    }

    stages {

        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run & Retry Tests') {
            steps {
                script {
                    def retries = params.RETRY_COUNT.toInteger()
                    def allTests = ["LoginTest","SignupTest","SearchTest","CheckoutTest","ProfileUpdateTest",
                                    "LogoutTest","AddToCartTest","RemoveFromCartTest","PaymentTest",
                                    "OrderHistoryTest","FilterTest","SortTest","WishlistTest","ReviewTest","NotificationTest"]

                    def failedTests = allTests

                    for (int attempt = 1; attempt <= retries; attempt++) {
                        if (failedTests.isEmpty()) {
                            echo "✅ All tests passed before reaching retry #${attempt}"
                            break
                        }

                        echo "🔁 Retry #${attempt} for: ${failedTests}"

                        // Split failed tests into batches for parallel execution
                        def parallelSteps = [:]
                        failedTests.collate(4).eachWithIndex { testBatch, idx ->
                            def batchName = "Batch_${idx+1}"
                            parallelSteps[batchName] = {
                                testBatch.each { test ->
                                    sh """
                                    npx testcafe 'chromium:headless' tests/flaky-test.js -t ${test} \
                                    --concurrency 2 --reporter junit:${env.REPORT_DIR}/${test}.xml || true
                                    """
                                }
                            }
                        }

                        // Run batches in parallel
                        parallel parallelSteps

                        // Collect failed tests by checking XML
                        def currentFailures = []
                        failedTests.each { test ->
                            def resultXml = readFile("${env.REPORT_DIR}/${test}.xml")
                            if (resultXml.contains('failures="1"')) {
                                currentFailures.add(test)
                            }
                        }

                        failedTests = currentFailures
                    }

                    if (failedTests.isEmpty()) {
                        currentBuild.result = 'SUCCESS'
                        echo "✅ All tests passed after retries"
                    } else {
                        currentBuild.result = 'UNSTABLE'
                        echo "⚠️ Persistent failures after ${retries} retries: ${failedTests}"
                    }
                }
            }
        }

        stage('Archive & Publish Reports') {
            steps {
                archiveArtifacts artifacts: 'reports/*.xml', allowEmptyArchive: true
                junit 'reports/*.xml'
                echo "📘 Reports saved under 'reports'"
            }
        }
    }
}

