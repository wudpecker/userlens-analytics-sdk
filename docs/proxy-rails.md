# Ruby on Rails Proxy Setup

This guide shows how to forward Userlens events through your Ruby on Rails backend.

## Why Use a Proxy?

- **Ad blocker resistant** — Events go to your domain, not a third-party
- **Secure API key** — Your Write Code stays on the server
- **Data control** — Filter, enrich, or validate events before forwarding

---

## Quick Setup

### Step 1: Get Your Write Code

1. Go to [Userlens Settings](https://app.userlens.io/settings/userlens-sdk)
2. Copy your **Write Code**
3. Add it to your credentials or environment

```bash
# config/credentials.yml.enc (using Rails credentials)
userlens:
  write_code: your-write-code-here

# Or using environment variables
# .env
USERLENS_WRITE_CODE=your-write-code-here
```

### Step 2: Create the Controller

```ruby
# app/controllers/api/userlens_controller.rb
module Api
  class UserlensController < ApplicationController
    skip_before_action :verify_authenticity_token

    RAW_URL = 'https://raw.userlens.io/raw/event'.freeze

    def events
      events_data = params.permit!.to_h['_json'] || JSON.parse(request.raw_post)

      unless events_data.is_a?(Array)
        return render json: { error: 'Invalid request body' }, status: :bad_request
      end

      write_code = Rails.application.credentials.dig(:userlens, :write_code) ||
                   ENV['USERLENS_WRITE_CODE']

      unless write_code.present?
        Rails.logger.error('USERLENS_WRITE_CODE is not configured')
        return render json: { error: 'Analytics not configured' }, status: :internal_server_error
      end

      response = HTTP.headers(
        'Content-Type' => 'application/json',
        'Authorization' => "Basic #{write_code}"
      ).post(RAW_URL, json: { events: events_data })

      if response.status.success?
        render json: { success: true }
      else
        Rails.logger.error("Userlens API error: #{response.body}")
        render json: { error: 'Failed to forward events' }, status: :internal_server_error
      end
    rescue StandardError => e
      Rails.logger.error("Userlens forwarding error: #{e.message}")
      render json: { error: 'Failed to track events' }, status: :internal_server_error
    end
  end
end
```

### Step 3: Add the Route

```ruby
# config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    post 'userlens/events', to: 'userlens#events'
  end

  # ... your other routes
end
```

### Step 4: Add the HTTP Gem

```ruby
# Gemfile
gem 'http'
```

Then run:

```bash
bundle install
```

---

## Alternative: Using Net::HTTP (No Extra Gems)

If you prefer not to add the `http` gem:

```ruby
# app/controllers/api/userlens_controller.rb
require 'net/http'
require 'uri'
require 'json'

module Api
  class UserlensController < ApplicationController
    skip_before_action :verify_authenticity_token

    RAW_URL = URI('https://raw.userlens.io/raw/event').freeze

    def events
      events_data = JSON.parse(request.raw_post)

      unless events_data.is_a?(Array)
        return render json: { error: 'Invalid request body' }, status: :bad_request
      end

      write_code = Rails.application.credentials.dig(:userlens, :write_code) ||
                   ENV['USERLENS_WRITE_CODE']

      unless write_code.present?
        Rails.logger.error('USERLENS_WRITE_CODE is not configured')
        return render json: { error: 'Analytics not configured' }, status: :internal_server_error
      end

      http = Net::HTTP.new(RAW_URL.host, RAW_URL.port)
      http.use_ssl = true

      request = Net::HTTP::Post.new(RAW_URL.path)
      request['Content-Type'] = 'application/json'
      request['Authorization'] = "Basic #{write_code}"
      request.body = { events: events_data }.to_json

      response = http.request(request)

      if response.is_a?(Net::HTTPSuccess)
        render json: { success: true }
      else
        Rails.logger.error("Userlens API error: #{response.body}")
        render json: { error: 'Failed to forward events' }, status: :internal_server_error
      end
    rescue JSON::ParserError
      render json: { error: 'Invalid JSON' }, status: :bad_request
    rescue StandardError => e
      Rails.logger.error("Userlens forwarding error: #{e.message}")
      render json: { error: 'Failed to track events' }, status: :internal_server_error
    end
  end
end
```

---

## Using Faraday

If you're already using Faraday in your project:

```ruby
# app/controllers/api/userlens_controller.rb
module Api
  class UserlensController < ApplicationController
    skip_before_action :verify_authenticity_token

    RAW_URL = 'https://raw.userlens.io/raw/event'.freeze

    def events
      events_data = JSON.parse(request.raw_post)

      unless events_data.is_a?(Array)
        return render json: { error: 'Invalid request body' }, status: :bad_request
      end

      write_code = Rails.application.credentials.dig(:userlens, :write_code) ||
                   ENV['USERLENS_WRITE_CODE']

      conn = Faraday.new do |f|
        f.request :json
        f.response :json
      end

      response = conn.post(RAW_URL) do |req|
        req.headers['Authorization'] = "Basic #{write_code}"
        req.body = { events: events_data }
      end

      if response.success?
        render json: { success: true }
      else
        Rails.logger.error("Userlens API error: #{response.body}")
        render json: { error: 'Failed to forward events' }, status: :internal_server_error
      end
    rescue StandardError => e
      Rails.logger.error("Userlens forwarding error: #{e.message}")
      render json: { error: 'Failed to track events' }, status: :internal_server_error
    end
  end
end
```

---

## Background Job Processing (Optional)

For high-traffic applications, process events asynchronously:

```ruby
# app/jobs/userlens_forward_job.rb
class UserlensForwardJob < ApplicationJob
  queue_as :default

  RAW_URL = 'https://raw.userlens.io/raw/event'.freeze

  def perform(events)
    write_code = Rails.application.credentials.dig(:userlens, :write_code) ||
                 ENV['USERLENS_WRITE_CODE']

    response = HTTP.headers(
      'Content-Type' => 'application/json',
      'Authorization' => "Basic #{write_code}"
    ).post(RAW_URL, json: { events: events })

    unless response.status.success?
      Rails.logger.error("Userlens API error: #{response.body}")
    end
  end
end

# app/controllers/api/userlens_controller.rb
module Api
  class UserlensController < ApplicationController
    skip_before_action :verify_authenticity_token

    def events
      events_data = JSON.parse(request.raw_post)

      unless events_data.is_a?(Array)
        return render json: { error: 'Invalid request body' }, status: :bad_request
      end

      # Queue for background processing
      UserlensForwardJob.perform_later(events_data)

      render json: { success: true }
    rescue JSON::ParserError
      render json: { error: 'Invalid JSON' }, status: :bad_request
    end
  end
end
```

---

## API-Only Rails Applications

For Rails API-only apps, the controller is simpler (no CSRF handling needed):

```ruby
# app/controllers/api/userlens_controller.rb
module Api
  class UserlensController < ApplicationController
    RAW_URL = 'https://raw.userlens.io/raw/event'.freeze

    def events
      events_data = params[:_json] || JSON.parse(request.raw_post)

      unless events_data.is_a?(Array)
        return render json: { error: 'Invalid request body' }, status: :bad_request
      end

      write_code = Rails.application.credentials.dig(:userlens, :write_code)

      response = HTTP.headers(
        'Content-Type' => 'application/json',
        'Authorization' => "Basic #{write_code}"
      ).post(RAW_URL, json: { events: events_data })

      if response.status.success?
        render json: { success: true }
      else
        render json: { error: 'Failed to forward events' }, status: :internal_server_error
      end
    end
  end
end
```

---

## Testing Your Setup

### Using Rails Console

```ruby
# rails console
events = [{ event: 'test-event', is_raw: false, properties: {} }]

write_code = Rails.application.credentials.dig(:userlens, :write_code)

response = HTTP.headers(
  'Content-Type' => 'application/json',
  'Authorization' => "Basic #{write_code}"
).post('https://raw.userlens.io/raw/event', json: { events: events })

puts response.status  # Should be 200
```

### Using cURL

```bash
curl -X POST http://localhost:3000/api/userlens/events \
  -H "Content-Type: application/json" \
  -d '[{"event": "test-event", "is_raw": false, "properties": {}}]'
```

---

## Frontend Configuration

With your backend ready, configure the SDK:

```tsx
// React
<UserlensProvider config={{
  userId: user.id,
  userTraits: { email: user.email },
  eventCollector: {
    callback: (events) => {
      fetch('/api/userlens/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events),
      });
    },
  },
}}>
```

---

## Next Steps

- **[React Setup](./react.md)** — Complete frontend configuration
- **[Next.js Setup](./nextjs.md)** — Next.js-specific patterns
- **[Custom Events](./custom-events.md)** — Track specific user actions
