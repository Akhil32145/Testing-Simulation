pipeline {
    agent { label 'ubuntu-agent' }  // ✅ Run this pipeline on the SSH agent

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
                    def allTests = [
                        "LoginTest","SignupTest","SearchTest","CheckoutTest","ProfileUpdateTest",
                        "LogoutTest","AddToCartTest","RemoveFromCartTest","PaymentTest",
                        "OrderHistoryTest","FilterTest","SortTest","WishlistTest","ReviewTest","NotificationTest"
                    ]

                    def failedTests = allTests

                    for (int attempt = 1; attempt <= retries; attempt++) {
                        if (failedTests.isEmpty()) {
                            echo "✅ All tests passed before reaching retry #${attempt}"
                            break
                        }

                        echo "🔁 Retry #${attempt} for: ${failedTests}"
                        def currentFailures = []

