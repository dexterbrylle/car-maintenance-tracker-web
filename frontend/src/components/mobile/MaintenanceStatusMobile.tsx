import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, Wrench, Eye, Droplets, Zap, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { DashboardMaintenanceItem } from '@/types';
import { cn } from '@/lib/utils';

interface MaintenanceStatusMobileProps {
  maintenanceStatus: {
    due_now: DashboardMaintenanceItem[];
    due_soon: DashboardMaintenanceItem[];
    ok: DashboardMaintenanceItem[];
  };
  onMarkComplete: (itemId: string) => void;
  onScheduleService?: (itemId: string) => void;
  className?: string;
}

export function MaintenanceStatusMobile({
  maintenanceStatus,
  onMarkComplete,
  onScheduleService,
  className
}: MaintenanceStatusMobileProps) {
  const [expandedSections, setExpandedSections] = useState({
    due_now: true,
    due_soon: true,
    ok: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusBadge = (status: 'due_now' | 'due_soon' | 'ok') => {
    switch (status) {
      case "due_now":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 text-xs">
            <AlertTriangle className="w-3 h-3" />
            Due Now
          </Badge>
        );
      case "due_soon":
        return (
          <Badge className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="w-3 h-3" />
            Due Soon
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            OK
          </Badge>
        );
    }
  };

  const getActionIcon = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'replace':
        return <Wrench className="w-4 h-4" />;
      case 'inspect':
        return <Eye className="w-4 h-4" />;
      case 'lubricate':
        return <Droplets className="w-4 h-4" />;
      case 'tighten':
        return <Zap className="w-4 h-4" />;
      case 'service':
        return <Settings className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    if (!action) return null;
    
    const colors = {
      replace: 'bg-red-100 text-red-700',
      inspect: 'bg-blue-100 text-blue-700',
      lubricate: 'bg-purple-100 text-purple-700',
      tighten: 'bg-orange-100 text-orange-700',
      service: 'bg-gray-100 text-gray-700'
    };
    
    const colorClass = colors[action.toLowerCase() as keyof typeof colors] || colors.service;
    
    return (
      <Badge variant="outline" className={`flex items-center gap-1 text-xs ${colorClass} border-0`}>
        {getActionIcon(action)}
        {action}
      </Badge>
    );
  };

  const getStatusText = (item: DashboardMaintenanceItem, status: 'due_now' | 'due_soon' | 'ok') => {
    switch (status) {
      case "due_now":
        if (item.miles_overdue) {
          return (
            <span className="text-red-600 font-semibold text-base">
              {item.miles_overdue.toLocaleString()} km overdue
            </span>
          );
        }
        return <span className="text-red-600 font-semibold text-base">Due Now</span>;
      case "due_soon":
        if (item.miles_until_due) {
          return (
            <span className="text-yellow-600 font-semibold text-base">
              Due in {item.miles_until_due.toLocaleString()} km
            </span>
          );
        }
        return <span className="text-yellow-600 font-semibold text-base">Due Soon</span>;
      default:
        if (item.miles_until_due) {
          return (
            <span className="text-green-600 font-semibold text-base">
              Due in {item.miles_until_due.toLocaleString()} km
            </span>
          );
        }
        return <span className="text-green-600 font-semibold text-base">Up to Date</span>;
    }
  };

  const getDueAtText = (item: DashboardMaintenanceItem) => {
    if (item.due_at_mileage) {
      return `Due at ${item.due_at_mileage.toLocaleString()} km`;
    }
    return null;
  };

  const getLastServiceText = (item: DashboardMaintenanceItem) => {
    if (item.last_service_mileage) {
      const text = `Last: ${item.last_service_mileage.toLocaleString()} km`;
      if (item.last_service_date) {
        const date = new Date(item.last_service_date).toLocaleDateString();
        return `${text} (${date})`;
      }
      return text;
    }
    return "Never serviced";
  };

  const MaintenanceItemCard = ({ 
    item, 
    status 
  }: { 
    item: DashboardMaintenanceItem; 
    status: 'due_now' | 'due_soon' | 'ok' 
  }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const maintenanceItem = item.maintenance_item;

    const handleMarkComplete = async () => {
      setIsSubmitting(true);
      try {
        await onMarkComplete(maintenanceItem._id);
      } catch (error) {
        console.error('Failed to mark service as complete:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Card className={cn(
        "w-full transition-all duration-200 mb-4",
        status === 'due_now' ? 'border-red-200 bg-red-50/30' : 
        status === 'due_soon' ? 'border-yellow-200 bg-yellow-50/30' : 
        'border-green-200 bg-green-50/30'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-tight break-words mb-1">
                {maintenanceItem.name}
              </CardTitle>
              <div className="text-sm text-muted-foreground mb-2">
                {maintenanceItem.category}
              </div>
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(status)}
                {getActionBadge(maintenanceItem.action || '')}
              </div>
              <div className="text-base font-medium">
                {getStatusText(item, status)}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {getDueAtText(item) && (
              <div className="text-sm text-muted-foreground">
                {getDueAtText(item)}
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              <div>Every {maintenanceItem.interval_km?.toLocaleString() || 'N/A'} km</div>
              <div>{getLastServiceText(item)}</div>
            </div>
          </div>

          {maintenanceItem.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {maintenanceItem.description}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            {status !== "ok" && (
              <Button
                onClick={handleMarkComplete}
                disabled={isSubmitting}
                size="lg"
                className="flex-1 h-12 text-base font-semibold"
                variant={status === 'due_now' ? 'default' : 'outline'}
              >
                {isSubmitting ? "Marking..." : "Complete"}
              </Button>
            )}
            
            {onScheduleService && (
              <Button
                onClick={() => onScheduleService(maintenanceItem._id)}
                size="lg"
                variant="outline"
                className="h-12 text-base font-semibold min-w-[100px]"
              >
                Quick Log
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const SectionHeader = ({ 
    title, 
    count, 
    status, 
    isExpanded 
  }: { 
    title: string; 
    count: number; 
    status: 'due_now' | 'due_soon' | 'ok'; 
    isExpanded: boolean;
  }) => (
    <div 
      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer active:bg-gray-100 transition-colors"
      onClick={() => toggleSection(status)}
    >
      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold">{title}</div>
        <Badge variant="outline" className="text-sm">
          {count}
        </Badge>
        {getStatusBadge(status)}
      </div>
      <div className="text-gray-500">
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </div>
    </div>
  );

  return (
    <div className={cn("w-full max-w-md mx-auto px-4 pb-20", className)}>
      {/* Due Now Section */}
      {maintenanceStatus.due_now.length > 0 && (
        <div className="mb-6">
          <SectionHeader
            title="Due Now"
            count={maintenanceStatus.due_now.length}
            status="due_now"
            isExpanded={expandedSections.due_now}
          />
          {expandedSections.due_now && (
            <div className="mt-4">
              {maintenanceStatus.due_now.map((item) => (
                <MaintenanceItemCard
                  key={item.maintenance_item._id}
                  item={item}
                  status="due_now"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Due Soon Section */}
      {maintenanceStatus.due_soon.length > 0 && (
        <div className="mb-6">
          <SectionHeader
            title="Due Soon"
            count={maintenanceStatus.due_soon.length}
            status="due_soon"
            isExpanded={expandedSections.due_soon}
          />
          {expandedSections.due_soon && (
            <div className="mt-4">
              {maintenanceStatus.due_soon.map((item) => (
                <MaintenanceItemCard
                  key={item.maintenance_item._id}
                  item={item}
                  status="due_soon"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Up to Date Section */}
      {maintenanceStatus.ok.length > 0 && (
        <div className="mb-6">
          <SectionHeader
            title="Up to Date"
            count={maintenanceStatus.ok.length}
            status="ok"
            isExpanded={expandedSections.ok}
          />
          {expandedSections.ok && (
            <div className="mt-4">
              {maintenanceStatus.ok.map((item) => (
                <MaintenanceItemCard
                  key={item.maintenance_item._id}
                  item={item}
                  status="ok"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {maintenanceStatus.due_now.length === 0 && 
       maintenanceStatus.due_soon.length === 0 && 
       maintenanceStatus.ok.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <div className="text-gray-500 text-lg mb-2">No maintenance items</div>
            <div className="text-gray-400 text-sm">Add maintenance items to get started</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}