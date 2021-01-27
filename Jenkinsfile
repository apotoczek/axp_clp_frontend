#!groovy

pipeline {
    agent {
        dockerfile {
            dir "repo"
        }
    }

    options {
        checkoutToSubdirectory("repo")
        timeout(time: 20, unit: 'MINUTES')
    }

    environment {
        NODE_ENV = get_node_env(env.BRANCH_NAME)

        GITREV = "${env.GIT_COMMIT.substring(0, 8)}"
        BUILD_NAME = "${DEPLOYMENT}-${env.BRANCH_NAME}-build-${GITREV}.tgz"

        REPO_PATH = "${env.WORKSPACE}/repo"

        BUILT_PATH = "${REPO_PATH}/built"
        REV_FILE = "$BUILT_PATH/rev"

        COMMANDER_SRC_PATH = "${REPO_PATH}/commander"
        TESTS_PATH = "${REPO_PATH}/tests"
        CORE_SRC_PATH = "${REPO_PATH}/core"
        LIBS_PATH = "${REPO_PATH}/shared"

        BACKUPCONFIG = "${REPO_PATH}/tools/s3backup-config.yaml"
        STAGING_BACKUPCONFIG = "${REPO_PATH}/tools/staging-s3backup-config.yaml"
        HOME = "."
    }

    stages {
        stage('start') {
            steps {
                slackSend(
                    message: "*BUILD STARTED* '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (<${env.BUILD_URL}|Open>)",
                )
            }
        }

        stage('setup') {
            environment {
                NODE_ENV = 'testing'
            }
            steps {
                dir('repo/tools') {
                    sh "npm ci"
                }
            }
        }

        stage('audit') {
            when {
                beforeAgent true
                changeRequest()
            }

            steps {
                dir('repo/tools') {
                    sh "npm audit --production --audit-level=high"
                }
            }
        }

        stage("prettier") {
            when {
                beforeAgent true
                changeRequest()
            }

            environment {
                PRETTIER = "node_modules/.bin/prettier --config .prettierrc --ignore-path .prettierignore --check --loglevel error"
            }

            steps {
                dir('repo/tools') {
                    sh "${PRETTIER} \"${COMMANDER_SRC_PATH}/**/*.{js,jsx}\" "
                    sh "${PRETTIER} \"${CORE_SRC_PATH}/**/*.{js,jsx}\" "
                    sh "${PRETTIER} \"${LIBS_PATH}/**/*.{js,jsx}\" "
                    sh "${PRETTIER} \"${TESTS_PATH}/**/*.js\""
                }
            }
        }

        stage("lint") {
            when {
                beforeAgent true
                changeRequest()
            }

            environment {
                LINT = "node_modules/.bin/eslint --ext .js,.jsx -c .eslintrc.yml --ignore-path .eslintignore"
                LINT_TESTS = "${LINT} --env node,jasmine"
                STYLELINT = "node_modules/.bin/stylelint --config .stylelintrc.yml --ignore_path .stylelintignore"
            }

            steps {
                dir('repo/tools') {
                    sh "${LINT} ${COMMANDER_SRC_PATH}"
                    sh "${LINT} ${CORE_SRC_PATH}"
                    sh "${LINT} ${LIBS_PATH}"
                    sh "${LINT_TESTS} ${TESTS_PATH}"

                    sh "${STYLELINT} ${COMMANDER_SRC_PATH}/**/*.js"
                    sh "${STYLELINT} ${COMMANDER_SRC_PATH}/**/*.jsx"
                    sh "${STYLELINT} ${CORE_SRC_PATH}/**/*.js"
                    sh "${STYLELINT} ${CORE_SRC_PATH}/**/*.jsx"
                    sh "${STYLELINT} ${LIBS_PATH}/**/*.js"
                    sh "${STYLELINT} ${LIBS_PATH}/**/*.jsx"
                }
            }
        }

        stage("test") {
            when {
                beforeAgent true
                changeRequest()
            }

            environment {
                CHROME_BIN = 'chromium-browser'
                DEPLOYMENT = 'bison'
            }

            steps {
                dir('repo/tools') {
                    sh "node_modules/.bin/karma start ../tests/jenkins.conf.js"
                }
                junit "**/test-results.xml"
                step([
                    $class: 'CoberturaPublisher',
                    autoUpdateHealth: false,
                    autoUpdateStability: false,
                    coberturaReportFile: '**/cobertura-coverage.xml',
                    failUnhealthy: false,
                    failUnstable: false,
                    maxNumberOfBuilds: 0,
                    onlyStable: false,
                    sourceEncoding: 'ASCII',
                    zoomCoverageChart: false
                ])
            }
        }


        stage("master build") {
            when {
                beforeAgent true
                branch "master"
            }

            environment {
                DEPLOYMENT = 'hl'
            }

            steps {
                buildjs('core')
                buildjs('commander')
                upload(env.BACKUPCONFIG, env.DEPLOYMENT, env.BRANCH_NAME, env.GITREV)
            }
        }

        stage("staging build") {
            when {
                beforeAgent true
                branch "staging/*"
            }

            environment {
                STAGING_PREFIX = "${env.BRANCH_NAME.split('/')[1]}"
                DEPLOYMENT = stagingDeployment(STAGING_PREFIX)
            }

            steps {
                buildjs('core')
                buildjs('commander')
                buildjs('storybook')
                dir('repo') {
                    sh """
                        s3backup -c ${STAGING_BACKUPCONFIG} backup \
                                -t built_${DEPLOYMENT} \
                                -rn ${STAGING_PREFIX}-build-${gitrev}.tgz
                    """
                }
            }
        }

        stage("staging deploy") {
            when {
                beforeAgent true
                branch 'staging/*'
            }

            environment {
                STAGING_PREFIX = "${env.BRANCH_NAME.split('/')[1]}"
            }

            steps {
                salt(
                    authtype: 'pam',
                    clientInterface: local(
                        function: 'event.send',
                        target: 'salt-master-*',
                        targettype: 'glob',
                        arguments: "'staging/deploy/${STAGING_PREFIX}/frontend'",
                        blockbuild: true,
                        jobPollTime: 5
                    ),
                    credentialsId: 'jenkins-salt-pam-credentials',
                    servername: 'http://salt-master.cobalt.internal:8000',
                )
            }
        }
    }

    post {
        success {
            slackSend(
                color: "good",
                message: "*BUILD SUCCESS* '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (<${env.BUILD_URL}|Open>)"
            )
        }

        unstable {
            slackSend(
                color: "warning",
                message: "*BUILD UNSTABLE* '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (<${env.BUILD_URL}|Open>)",
            )
        }

        failure {
            slackSend(
                color: "danger",
                message: "*BUILD FAILED* '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (<${env.BUILD_URL}|Open>)"
            )
        }

        cleanup {
            deleteDir()
        }
    }
}

def stagingDeployment(prefix) {
    def deployment = sh(
        returnStdout: true,
        script: """
            aws secretsmanager get-secret-value \
                --secret-id "staging/environment/${prefix}" \
                | jq -r ".SecretString | fromjson | .deployment"
        """
    ).trim()

    if(deployment == 'cobalt_lp') {
        return 'hl'
    } else {
        return 'bison'
    }
}

def upload(backup_config_path, deployment, branch, gitrev) {
    dir('repo') {
        sh """
            s3backup -c ${backup_config_path} backup \
                    -t built_${deployment} \
                    -rn ${branch}-build-${gitrev}.tgz
        """
    }
}

def buildjs(target) {
    dir('repo/tools') {
        sh "./build.sh ${target}"
    }
}


def get_node_env(branch_name) {
    if(branch_name ==~ /staging(.*)/) {
        return "staging";
    } else {
        return "production";
    }
}
