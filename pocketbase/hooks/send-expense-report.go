// PocketBase custom API route for sending expense report emails
// This file should be placed in your PocketBase pb_hooks directory as send-expense-report.go

package main

import (
    "bytes"
    "encoding/json"
    "net/http"
    "os"

    "github.com/pocketbase/pocketbase"
    "github.com/pocketbase/pocketbase/apis"
    "github.com/pocketbase/pocketbase/core"
)

type EmailRequest struct {
    Name    string `json:"name"`
    Email   string `json:"email"`
    PPS     string `json:"pps"`
    PDFData string `json:"pdfData"`
}

func init() {
    // This will be called when the hook is loaded
}

func main() {
    app := pocketbase.New()

    app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
        e.Router.POST("/api/send-expense-report", func(c echo.Context) error {
            // Parse request body
            var req EmailRequest
            if err := c.Bind(&req); err != nil {
                return apis.NewBadRequestError("Invalid request body", err)
            }

            // Validate required fields
            if req.Name == "" || req.Email == "" || req.PPS == "" || req.PDFData == "" {
                return apis.NewBadRequestError("Missing required fields", nil)
            }

            // Prepare email data for Resend API
            emailData := map[string]interface{}{
                "from": "Nexus Ventures Expense Report <log@happydreamsireland.com>",
                "to":  []string{"jesus@irishtaxagents.com"},
                "subject": "Nuevo Expense Report - " + req.Name,
                "html": `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px;">
                            Nuevo Expense Report
                        </h1>

                        <p style="font-size: 16px; margin: 20px 0;">
                            Se ha recibido un nuevo expense report.
                        </p>

                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Nombre:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">` + req.Name + `</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">` + req.Email + `</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><strong>PPS:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">` + req.PPS + `</td>
                            </tr>
                        </table>

                        <p style="font-size: 14px; color: #666; margin: 20px 0;">
                            El PDF del expense report está adjunto.
                        </p>
                    </div>
                `,
                "attachments": []map[string]interface{}{
                    {
                        "filename": "expense-report.pdf",
                        "content":  req.PDFData,
                        "type":     "application/pdf",
                    },
                },
            }

            // Convert to JSON
            jsonData, err := json.Marshal(emailData)
            if err != nil {
                return apis.NewInternalServerError("Failed to prepare email data", err)
            }

            // Send email via Resend API
            resendURL := "https://api.resend.com/emails"
            resendAPIKey := os.Getenv("RESEND_API_KEY")

            if resendAPIKey == "" {
                return apis.NewInternalServerError("RESEND_API_KEY not configured", nil)
            }

            req, err := http.NewRequest("POST", resendURL, bytes.NewBuffer(jsonData))
            if err != nil {
                return apis.NewInternalServerError("Failed to create request", err)
            }

            req.Header.Set("Content-Type", "application/json")
            req.Header.Set("Authorization", "Bearer "+resendAPIKey)

            client := &http.Client{}
            resp, err := client.Do(req)
            if err != nil {
                return apis.NewInternalServerError("Failed to send email", err)
            }
            defer resp.Body.Close()

            if resp.StatusCode != http.StatusOK {
                return apis.NewInternalServerError("Email service returned error", nil)
            }

            return c.JSON(http.StatusOK, map[string]interface{}{
                "success": true,
                "message": "Email sent successfully",
            })

        })
        return nil
    })

    if err := app.Start(); err != nil {
        panic(err)
    }
}