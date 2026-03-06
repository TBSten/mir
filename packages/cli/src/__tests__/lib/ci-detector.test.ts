import { describe, it, expect, afterEach, vi } from "vitest";
import { isCIEnvironment } from "../../lib/ci-detector.js";

describe("isCIEnvironment", () => {
  afterEach(() => {
    // 各テスト後に環境変数を元に戻す
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    delete process.env.GITLAB_CI;
    delete process.env.CIRCLECI;
    delete process.env.TRAVIS;
    delete process.env.JENKINS_URL;
    delete process.env.BITBUCKET_PIPELINE_UUID;
    delete process.env.TF_BUILD;
  });

  it("CI 環境変数が設定されている場合 true を返す", () => {
    process.env.CI = "true";
    expect(isCIEnvironment()).toBe(true);
  });

  it("GITHUB_ACTIONS が設定されている場合 true を返す", () => {
    process.env.GITHUB_ACTIONS = "true";
    expect(isCIEnvironment()).toBe(true);
  });

  it("GITLAB_CI が設定されている場合 true を返す", () => {
    process.env.GITLAB_CI = "true";
    expect(isCIEnvironment()).toBe(true);
  });

  it("CIRCLECI が設定されている場合 true を返す", () => {
    process.env.CIRCLECI = "true";
    expect(isCIEnvironment()).toBe(true);
  });

  it("TRAVIS が設定されている場合 true を返す", () => {
    process.env.TRAVIS = "true";
    expect(isCIEnvironment()).toBe(true);
  });

  it("JENKINS_URL が設定されている場合 true を返す", () => {
    process.env.JENKINS_URL = "http://jenkins.example.com";
    expect(isCIEnvironment()).toBe(true);
  });

  it("TF_BUILD が設定されている場合 true を返す (Azure Pipelines)", () => {
    process.env.TF_BUILD = "True";
    expect(isCIEnvironment()).toBe(true);
  });

  it("CI 関連の環境変数が設定されていない場合 false を返す", () => {
    // vitest 実行時に CI 環境変数が設定されている可能性があるため
    // すべてを明示的に削除してテスト
    const saved = {
      CI: process.env.CI,
      GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
      GITLAB_CI: process.env.GITLAB_CI,
      CIRCLECI: process.env.CIRCLECI,
      TRAVIS: process.env.TRAVIS,
      JENKINS_URL: process.env.JENKINS_URL,
      BITBUCKET_PIPELINE_UUID: process.env.BITBUCKET_PIPELINE_UUID,
      TF_BUILD: process.env.TF_BUILD,
    };

    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    delete process.env.GITLAB_CI;
    delete process.env.CIRCLECI;
    delete process.env.TRAVIS;
    delete process.env.JENKINS_URL;
    delete process.env.BITBUCKET_PIPELINE_UUID;
    delete process.env.TF_BUILD;

    const result = isCIEnvironment();

    // テスト後に元に戻す
    for (const [key, value] of Object.entries(saved)) {
      if (value !== undefined) {
        process.env[key] = value;
      }
    }

    expect(result).toBe(false);
  });
});
