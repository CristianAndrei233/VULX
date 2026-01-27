#!/usr/bin/env python3
"""
VULX Scanner Agent CLI
======================
Command-line interface for the VULX security scanner agent.

Environment Variables:
    VULX_API_KEY        - API key for VULX platform authentication
    VULX_API_URL        - VULX API URL (default: https://api.vulx.io)
    VULX_PROJECT_ID     - Project ID for scan results

Usage:
    vulx-agent scan --target https://api.example.com
    vulx-agent scan --target https://api.example.com --type full
    vulx-agent scan --spec ./openapi.yaml --target https://api.example.com
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from typing import Optional
import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich import print as rprint

from .scanner import VulxScanner, ScanConfig, ScanType
from .reporter import ResultReporter

console = Console()


def print_banner():
    """Print VULX banner"""
    banner = """
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║  ██╗   ██╗██╗   ██╗██╗     ██╗  ██╗                          ║
║  ██║   ██║██║   ██║██║     ╚██╗██╔╝                          ║
║  ██║   ██║██║   ██║██║      ╚███╔╝                           ║
║  ╚██╗ ██╔╝██║   ██║██║      ██╔██╗                           ║
║   ╚████╔╝ ╚██████╔╝███████╗██╔╝ ██╗                          ║
║    ╚═══╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝                          ║
║                                                               ║
║  SecureAPI Scanner Agent v1.0.0                               ║
║  Enterprise DAST for CI/CD Pipelines                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
"""
    console.print(banner, style="bold blue")


def print_summary(result: dict):
    """Print scan summary"""
    summary = result.get("summary", {})

    # Create summary table
    table = Table(title="Scan Summary", show_header=True, header_style="bold cyan")
    table.add_column("Severity", style="bold")
    table.add_column("Count", justify="right")

    severity_styles = {
        "CRITICAL": "bold red",
        "HIGH": "bold orange1",
        "MEDIUM": "bold yellow",
        "LOW": "bold blue",
        "INFO": "dim"
    }

    by_severity = summary.get("by_severity", {})
    for severity in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]:
        count = by_severity.get(severity, 0)
        style = severity_styles.get(severity, "white")
        table.add_row(severity, str(count), style=style)

    table.add_row("", "", style="dim")
    table.add_row("TOTAL", str(summary.get("total", 0)), style="bold white")

    console.print(table)

    # Risk score
    risk_score = result.get("risk_score", 0)
    if risk_score >= 75:
        score_style = "bold red"
        score_text = "CRITICAL RISK"
    elif risk_score >= 50:
        score_style = "bold orange1"
        score_text = "HIGH RISK"
    elif risk_score >= 25:
        score_style = "bold yellow"
        score_text = "MEDIUM RISK"
    else:
        score_style = "bold green"
        score_text = "LOW RISK"

    console.print(Panel(
        f"[{score_style}]Risk Score: {risk_score}/100 - {score_text}[/{score_style}]",
        title="Risk Assessment"
    ))


def print_findings(findings: list, show_remediation: bool = False):
    """Print detailed findings"""
    if not findings:
        console.print("\n[bold green]✓ No vulnerabilities found![/bold green]\n")
        return

    console.print(f"\n[bold]Detailed Findings ({len(findings)} issues)[/bold]\n")

    for i, finding in enumerate(findings, 1):
        severity = finding.get("severity", "INFO")
        severity_colors = {
            "CRITICAL": "red",
            "HIGH": "orange1",
            "MEDIUM": "yellow",
            "LOW": "blue",
            "INFO": "dim"
        }
        color = severity_colors.get(severity, "white")

        # Finding header
        console.print(f"[bold {color}]#{i} [{severity}] {finding.get('title', finding.get('type', 'Unknown'))}[/bold {color}]")
        console.print(f"   Endpoint: [cyan]{finding.get('method', 'GET')} {finding.get('endpoint', '/')}[/cyan]")

        if finding.get("owasp_category"):
            console.print(f"   OWASP: [dim]{finding['owasp_category']}[/dim]")

        if finding.get("cwe_id"):
            console.print(f"   CWE: [dim]{finding['cwe_id']}[/dim]")

        console.print(f"   [dim]{finding.get('description', '')[:200]}...[/dim]")

        if show_remediation and finding.get("remediation"):
            console.print(f"   [green]Fix: {finding['remediation'][:200]}...[/green]")

        console.print()


@click.group()
@click.version_option(version="1.0.0")
def cli():
    """VULX Security Scanner Agent - Enterprise DAST for CI/CD"""
    pass


@cli.command()
@click.option("--target", "-t", required=True, help="Target URL to scan")
@click.option("--spec", "-s", help="OpenAPI specification URL or file path")
@click.option("--type", "scan_type", type=click.Choice(["quick", "standard", "full"]), default="standard", help="Scan type")
@click.option("--project-id", "-p", envvar="VULX_PROJECT_ID", help="VULX project ID")
@click.option("--api-key", "-k", envvar="VULX_API_KEY", help="VULX API key")
@click.option("--api-url", envvar="VULX_API_URL", default="https://api.vulx.io", help="VULX API URL")
@click.option("--auth-token", help="Bearer token for authenticated scanning")
@click.option("--auth-header", multiple=True, help="Custom auth headers (format: 'Header: Value')")
@click.option("--fail-on", type=click.Choice(["critical", "high", "medium", "low"]), default="high", help="Exit with error if findings at or above this severity")
@click.option("--output", "-o", type=click.Path(), help="Output file for JSON results")
@click.option("--show-remediation", is_flag=True, help="Show remediation guidance")
@click.option("--quiet", "-q", is_flag=True, help="Minimal output")
@click.option("--json-output", is_flag=True, help="Output results as JSON only")
def scan(
    target: str,
    spec: Optional[str],
    scan_type: str,
    project_id: Optional[str],
    api_key: Optional[str],
    api_url: str,
    auth_token: Optional[str],
    auth_header: tuple,
    fail_on: str,
    output: Optional[str],
    show_remediation: bool,
    quiet: bool,
    json_output: bool
):
    """Run a security scan against a target API"""

    if not json_output and not quiet:
        print_banner()

    # Build scan configuration
    config = ScanConfig(
        target_url=target,
        openapi_spec=spec,
        scan_type=ScanType(scan_type),
        auth_token=auth_token,
        auth_headers=dict(h.split(": ", 1) for h in auth_header if ": " in h),
        vulx_api_key=api_key,
        vulx_api_url=api_url,
        vulx_project_id=project_id
    )

    # Run scan
    scanner = VulxScanner(config)

    if not json_output and not quiet:
        console.print(f"\n[bold]Starting {scan_type} scan of [cyan]{target}[/cyan][/bold]\n")

    async def run_scan():
        if json_output or quiet:
            return await scanner.scan()
        else:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                console=console
            ) as progress:
                task = progress.add_task("Scanning...", total=100)

                def on_progress(status: str, percent: int, message: str):
                    progress.update(task, completed=percent, description=f"{status}: {message}")

                scanner.on_progress(on_progress)
                return await scanner.scan()

    try:
        result = asyncio.run(run_scan())
    except KeyboardInterrupt:
        console.print("\n[yellow]Scan cancelled by user[/yellow]")
        sys.exit(130)
    except Exception as e:
        console.print(f"\n[red]Scan failed: {e}[/red]")
        sys.exit(1)

    # Output results
    if json_output:
        print(json.dumps(result, indent=2))
    else:
        if not quiet:
            print_summary(result)
            print_findings(result.get("findings", []), show_remediation)

            # Compliance summary
            compliance = result.get("compliance_summary", {})
            if compliance.get("total_controls_affected", 0) > 0:
                console.print(Panel(
                    f"[yellow]Compliance Impact: {compliance['total_controls_affected']} controls affected[/yellow]",
                    title="Compliance"
                ))

    # Save to file if requested
    if output:
        with open(output, "w") as f:
            json.dump(result, f, indent=2)
        if not quiet:
            console.print(f"\n[green]Results saved to {output}[/green]")

    # Report to VULX platform if configured
    if api_key and project_id:
        if not quiet:
            console.print("\n[dim]Uploading results to VULX platform...[/dim]")
        try:
            reporter = ResultReporter(api_url, api_key)
            asyncio.run(reporter.upload_results(project_id, result))
            if not quiet:
                console.print("[green]✓ Results uploaded successfully[/green]")
        except Exception as e:
            if not quiet:
                console.print(f"[yellow]Warning: Failed to upload results: {e}[/yellow]")

    # Determine exit code based on findings
    severity_levels = ["info", "low", "medium", "high", "critical"]
    fail_threshold = severity_levels.index(fail_on)

    findings = result.get("findings", [])
    for finding in findings:
        finding_severity = finding.get("severity", "INFO").lower()
        if finding_severity in severity_levels:
            if severity_levels.index(finding_severity) >= fail_threshold:
                if not quiet:
                    console.print(f"\n[red]✗ Failing due to {finding_severity.upper()} severity finding(s)[/red]")
                sys.exit(1)

    if not quiet:
        console.print("\n[green]✓ Scan completed successfully[/green]")

    sys.exit(0)


@cli.command()
@click.option("--api-key", "-k", envvar="VULX_API_KEY", required=True, help="VULX API key")
@click.option("--api-url", envvar="VULX_API_URL", default="https://api.vulx.io", help="VULX API URL")
def auth(api_key: str, api_url: str):
    """Verify authentication with VULX platform"""
    print_banner()

    console.print("\n[bold]Verifying authentication...[/bold]\n")

    reporter = ResultReporter(api_url, api_key)

    try:
        result = asyncio.run(reporter.verify_auth())
        if result.get("valid"):
            console.print("[green]✓ Authentication successful![/green]")
            console.print(f"  Organization: {result.get('organization', 'N/A')}")
            console.print(f"  Plan: {result.get('plan', 'N/A')}")
        else:
            console.print("[red]✗ Authentication failed[/red]")
            sys.exit(1)
    except Exception as e:
        console.print(f"[red]✗ Authentication error: {e}[/red]")
        sys.exit(1)


@cli.command()
def version():
    """Show version information"""
    console.print(f"VULX Scanner Agent v1.0.0")
    console.print(f"Python {sys.version}")


if __name__ == "__main__":
    cli()
