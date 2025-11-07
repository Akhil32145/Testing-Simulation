
pipeline {
    agent { label 'ubuntu-agent' }

    triggers {
        // Run every 2 minutes
        cron('H/2 * * * *')
    }

    parameters {
        string(name: 'RETRY_COUNT', defaultValue: '3', description: 'Number of retries for failed tests')
    }

    environment {
        REPORT_DIR = 'reports'
        SLACK_CHANNEL = '#ci-alerts'    // Update with your actual Slack channel
        SLACK_USER = 'jenkins-bot'      // Your bot name
    }

    stages {
        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Install Dependencies') {
            steps {
                ansiColor('xterm') {
                    sh 'npm install'
                }
            }
        }

        stage('Run & Retry Tests') {
            steps {
                ansiColor('xterm') {
                    script {
                        def retries = params.RETRY_COUNT.toInteger()
                        def allTests = [
                            "LoginTest","SignupTest","SearchTest","CheckoutTest","ProfileUpdateTest",
                            "LogoutTest","AddToCartTest","RemoveFromCartTest","PaymentTest",
                            "OrderHistoryTest","FilterTest","SortTest","WishlistTest","ReviewTest","NotificationTest"
                        ]
