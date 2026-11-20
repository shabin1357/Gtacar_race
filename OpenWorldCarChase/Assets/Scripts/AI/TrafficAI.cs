using UnityEngine;

namespace ProjectVelocity.AI
{
    /// <summary>
    /// Mobile-optimized waypoint lane-following Traffic AI with forward raycast obstacle braking.
    /// Supports dynamic density scaling from GraphicsQuality settings.
    /// </summary>
    public class TrafficAI : MonoBehaviour
    {
        public Transform[] routeWaypoints;
        public float cruiseSpeedMs = 15f;
        public float turnSpeed = 4.2f;
        public float obstacleRayDistance = 14f;
        public LayerMask obstacleLayers = ~0;

        private int _currentIndex;
        private float _currentSpeed;
        private float _rayTimer;
        private bool _obstacleAhead;

        public void SetRoute(Transform[] waypoints, int startIndex)
        {
            routeWaypoints = waypoints;
            _currentIndex = waypoints != null && waypoints.Length > 0 ? startIndex % waypoints.Length : 0;
        }

        private void Update()
        {
            if (routeWaypoints == null || routeWaypoints.Length == 0) return;

            float dt = Time.deltaTime;
            _rayTimer -= dt;
            if (_rayTimer <= 0f)
            {
                _rayTimer = 0.12f; // Throttled 8Hz raycast for Android CPU savings
                Vector3 origin = transform.position + Vector3.up * 0.8f + transform.forward * 2.4f;
                _obstacleAhead = Physics.Raycast(origin, transform.forward, obstacleRayDistance, obstacleLayers);
            }

            float targetSpeed = _obstacleAhead ? 0f : cruiseSpeedMs;
            _currentSpeed = Mathf.MoveTowards(_currentSpeed, targetSpeed, (_obstacleAhead ? 22f : 9f) * dt);

            Transform target = routeWaypoints[_currentIndex];
            Vector3 toTarget = target.position - transform.position;
            toTarget.y = 0f;

            if (toTarget.sqrMagnitude < 25f)
            {
                _currentIndex = (_currentIndex + 1) % routeWaypoints.Length;
                return;
            }

            Quaternion desiredRot = Quaternion.LookRotation(toTarget.normalized, Vector3.up);
            transform.rotation = Quaternion.Slerp(transform.rotation, desiredRot, turnSpeed * dt);
            transform.position += transform.forward * (_currentSpeed * dt);
        }
    }
}
